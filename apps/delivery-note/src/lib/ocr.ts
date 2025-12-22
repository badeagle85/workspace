import Tesseract from "tesseract.js";
import type { OcrApiResponse, TextAnnotation } from "@/app/api/ocr/route";
import type { OcrProvider } from "@/stores/settingsStore";
import { supabase } from "@/lib/supabase";

export interface OcrResult {
  text: string;
  confidence: number;
  lines: Array<{
    text: string;
    confidence: number;
  }>;
  annotations?: TextAnnotation[];
}

/**
 * 이미지에서 텍스트를 추출합니다
 * @param imageSource 이미지 URL 또는 File
 * @param provider OCR 제공자 (google 또는 tesseract)
 * @param onProgress 진행률 콜백
 */
export async function extractTextFromImage(
  imageSource: string | File,
  provider: OcrProvider = "tesseract",
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  // File을 Data URL로 변환
  let imageData: string;
  if (imageSource instanceof File) {
    imageData = await fileToDataUrl(imageSource);
  } else {
    imageData = imageSource;
  }

  if (provider === "google") {
    return extractWithGoogleVision(imageData, onProgress);
  } else {
    return extractWithTesseract(imageData, onProgress);
  }
}

/**
 * Google Cloud Vision API로 텍스트 추출
 */
async function extractWithGoogleVision(
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  onProgress?.(10);

  // 서버 API 호출
  const response = await fetch("/api/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageData }),
  });

  onProgress?.(80);

  const result: OcrApiResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error ?? "OCR 처리에 실패했습니다.");
  }

  onProgress?.(100);

  return {
    ...result.data,
    annotations: result.data.annotations,
  };
}

/**
 * Tesseract.js로 텍스트 추출
 */
async function extractWithTesseract(
  imageData: string,
  onProgress?: (progress: number) => void
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageData, "kor+eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const data = result.data;
  const fullText = data?.text ?? "";
  const confidence = data?.confidence ?? 0;

  // 텍스트를 라인으로 분리
  const textLines = fullText.split("\n");
  const lines = textLines
    .map((line) => ({
      text: line.trim(),
      confidence,
    }))
    .filter((line) => line.text.length > 0);

  return {
    text: fullText,
    confidence,
    lines,
  };
}

/**
 * File을 Data URL로 변환
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * OCR 결과에서 거래명세서 데이터를 파싱합니다
 */
export interface ParsedInvoice {
  supplier?: string;      // 공급자 상호 (공급업체)
  storeName?: string;     // 공급받는자 상호 (지점)
  date?: string;
  documentNumber?: string;
  items: ParsedItem[];
  totalAmount?: number;
}

export interface ParsedItem {
  sequence: number;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  raw: string; // 원본 라인
  originalQuantityText?: string; // OCR 원본 수량 텍스트 (보정 전)
  wasQuantityCorrected?: boolean; // 수량이 자동 보정되었는지 여부
  standardProductId?: string; // 매핑된 표준품목 ID
  standardProductName?: string; // 매핑된 표준품목 이름
}

/**
 * OCR 텍스트를 거래명세서 형식으로 파싱
 * 거래명세서 형식:
 * - 상단: 날짜 (2025년 10월 26일)
 * - 공급받는자/공급자 정보
 * - 품명 | 납품수량 | 비고 테이블
 *
 * 주의: OCR 결과에서 품명과 수량이 별도의 줄에 나올 수 있음
 */
export function parseInvoiceText(ocrResult: OcrResult | null): ParsedInvoice {
  if (!ocrResult) {
    return { items: [] };
  }

  const text = ocrResult.text ?? "";
  const lines = ocrResult.lines ?? [];

  // 날짜 추출 (2025년 10월 26일 또는 2025-10-26 등)
  let date: string | undefined;
  const datePattern1 = /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/;
  const datePattern2 = /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/;

  const dateMatch1 = text.match(datePattern1);
  const dateMatch2 = text.match(datePattern2);

  if (dateMatch1) {
    date = `${dateMatch1[1]}-${dateMatch1[2].padStart(2, '0')}-${dateMatch1[3].padStart(2, '0')}`;
  } else if (dateMatch2) {
    date = `${dateMatch2[1]}-${dateMatch2[2].padStart(2, '0')}-${dateMatch2[3].padStart(2, '0')}`;
  }

  // 공급받는자 상호 추출 (지점) - 보통 왼쪽에 있음
  // 공급자 상호 추출 (공급업체) - 보통 오른쪽에 있음
  let supplier: string | undefined;
  let storeName: string | undefined;

  // 전체 텍스트에서 공급받는자/공급자 섹션 찾기
  // 패턴: "공급받는자" ... "상호" ... "공급자" ... "상호"
  const receiverSection = text.match(/공\s*급\s*받\s*는\s*자[\s\S]*?상\s*호[:\s]*([^\n공]+)/);
  const supplierSection = text.match(/공\s*급\s*자[\s\S]*?상\s*호[:\s]*([^\n]+)/);

  if (receiverSection) {
    // 공급받는자 상호 (지점)
    storeName = receiverSection[1].trim()
      .replace(/등록번호[\s\S]*/g, "") // 등록번호 이후 제거
      .replace(/\s{2,}/g, " ")
      .trim();
    console.log("공급받는자 상호 (지점):", storeName);
  }

  if (supplierSection) {
    // 공급자 상호 (공급업체)
    supplier = supplierSection[1].trim()
      .replace(/\(인\)/g, "") // (인) 제거
      .replace(/등록번호[\s\S]*/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    console.log("공급자 상호 (공급업체):", supplier);
  }

  // 위 패턴으로 못 찾은 경우 대체 패턴
  if (!supplier && !storeName) {
    // 모든 상호 찾기 (보통 2개: 공급받는자, 공급자)
    const allCompanyNames = text.matchAll(/상\s*호[:\s]*([^\n등]+)/g);
    const names = Array.from(allCompanyNames).map(m => m[1].trim().replace(/\s{2,}/g, " "));
    if (names.length >= 2) {
      storeName = names[0]; // 첫 번째: 공급받는자 (지점)
      supplier = names[1].replace(/\(인\)/g, "").trim(); // 두 번째: 공급자 (공급업체)
    } else if (names.length === 1) {
      supplier = names[0];
    }
  }

  // 등록번호 추출
  let documentNumber: string | undefined;
  const regNumMatch = text.match(/등록번호[:\s]*([\d-]+)/);
  if (regNumMatch) {
    documentNumber = regNumMatch[1];
  }

  // 품명과 수량 추출 (좌표 정보가 있으면 좌표 기반 매칭 사용)
  const annotations = ocrResult.annotations;
  const items = annotations && annotations.length > 0
    ? extractItemsWithCoordinates(annotations)
    : extractItemsFromLines(lines);

  const result: ParsedInvoice = {
    date,
    supplier,
    storeName,
    documentNumber,
    items,
    totalAmount: undefined,
  };

  // 디버깅용 콘솔 출력
  console.log("=== OCR 파싱 결과 ===");
  console.log(JSON.stringify(result, null, 2));

  return result;
}

/**
 * 알려진 품명 목록 (세탁물 관련)
 */
const KNOWN_ITEM_NAMES = [
  "침대시트", "이불커버", "베개커버", "베개",
  "페이스 타올", "바스 타올", "풋 타올",
  "페이스타올", "바스타올", "풋타올",
  "가운", "패드", "이불", "방수커버", "걸레",
  "타올", "시트", "커버"
];

/**
 * 좌표 기반으로 품명과 수량을 매칭
 * Google Vision API의 textAnnotations 좌표 정보 활용
 * "품명" 헤더 아래에 있는 항목만 추출
 */
function extractItemsWithCoordinates(annotations: TextAnnotation[]): ParsedItem[] {
  const items: ParsedItem[] = [];

  // 1. "품명" 헤더 위치 찾기
  let itemHeaderY = 0;
  let itemHeaderX = 0;
  let quantityHeaderX = 0;

  for (const ann of annotations) {
    if (ann.text === "품명") {
      itemHeaderY = ann.bounds.y + ann.bounds.height;
      itemHeaderX = ann.bounds.x;
    }
    if (ann.text === "납품" || ann.text === "수량") {
      if (quantityHeaderX === 0) {
        quantityHeaderX = ann.bounds.x;
      }
    }
  }

  // 헤더를 찾지 못하면 fallback
  if (itemHeaderY === 0) {
    console.log("품명 헤더를 찾지 못했습니다. 기본 파싱 사용.");
    return extractItemsFallback(annotations);
  }

  console.log(`품명 헤더 위치: x=${itemHeaderX}, y=${itemHeaderY}`);
  console.log(`수량 헤더 X 위치: ${quantityHeaderX}`);

  // 2. 품명 열과 수량 열의 X 범위 정의
  // 품명 열: 헤더 X 기준 좌우 300px
  const itemColMinX = itemHeaderX - 200;
  const itemColMaxX = itemHeaderX + 400;
  // 수량 열: 수량 헤더 X 기준 좌우 200px
  const qtyColMinX = quantityHeaderX - 100;
  const qtyColMaxX = quantityHeaderX + 300;

  // 3. 헤더 아래의 텍스트만 필터링
  interface AnnotatedText {
    text: string;
    y: number;
    x: number;
    height: number;
    width: number;
  }

  interface QuantityText extends AnnotatedText {
    originalText: string; // OCR 원본 텍스트
    wasCorrected: boolean; // 보정 여부
  }

  const itemTexts: AnnotatedText[] = [];
  const quantityTexts: QuantityText[] = [];

  for (const ann of annotations) {
    const centerY = ann.bounds.y + ann.bounds.height / 2;
    const centerX = ann.bounds.x + ann.bounds.width / 2;

    // 헤더 아래에 있는 것만
    if (ann.bounds.y < itemHeaderY) continue;

    // 품명 열에 있는 텍스트
    if (centerX >= itemColMinX && centerX <= itemColMaxX) {
      // 제외할 키워드
      const excluded = ["비", "고", "비고", "특이사항", "담당자", "검수", "입회", "수거", "납품"];
      if (!excluded.includes(ann.text)) {
        itemTexts.push({
          text: ann.text,
          y: centerY,
          x: ann.bounds.x,
          height: ann.bounds.height,
          width: ann.bounds.width,
        });
      }
    }

    // 수량 열에 있는 숫자 (OCR 오류 보정 포함)
    if (centerX >= qtyColMinX && centerX <= qtyColMaxX) {
      const originalText = ann.text;

      // OCR 일반적인 오류 보정
      let correctedText = originalText;
      correctedText = correctedText.replace(/[bB]/g, "6"); // b/B → 6
      correctedText = correctedText.replace(/[oO]/g, "0"); // o/O → 0
      correctedText = correctedText.replace(/[lI]/g, "1"); // l/I → 1
      correctedText = correctedText.replace(/[sS]/g, "5"); // s/S → 5
      correctedText = correctedText.replace(/[zZ]/g, "2"); // z/Z → 2
      correctedText = correctedText.replace(/[gq]/g, "9"); // g/q → 9

      const wasCorrected = correctedText !== originalText;

      if (/^\d+$/.test(correctedText)) {
        const num = parseInt(correctedText, 10);
        if (num > 0 && num < 10000) {
          quantityTexts.push({
            text: correctedText, // 보정된 숫자 사용
            originalText, // 원본 텍스트 저장
            wasCorrected, // 보정 여부
            y: centerY,
            x: ann.bounds.x,
            height: ann.bounds.height,
            width: ann.bounds.width,
          });
          if (wasCorrected) {
            console.log(`OCR 보정: "${originalText}" → "${correctedText}"`);
          }
        }
      }
    }
  }

  // 4. 같은 행의 텍스트들을 그룹화하여 품명 조합
  interface ItemRow {
    texts: AnnotatedText[];
    minY: number;
    maxY: number;
  }

  const rows: ItemRow[] = [];

  // Y 좌표로 정렬
  itemTexts.sort((a, b) => a.y - b.y);

  for (const txt of itemTexts) {
    // 기존 행에 추가할 수 있는지 확인
    let added = false;
    for (const row of rows) {
      const rowCenterY = (row.minY + row.maxY) / 2;
      const tolerance = 40; // Y 좌표 허용 오차
      if (Math.abs(txt.y - rowCenterY) < tolerance) {
        row.texts.push(txt);
        row.minY = Math.min(row.minY, txt.y - txt.height / 2);
        row.maxY = Math.max(row.maxY, txt.y + txt.height / 2);
        added = true;
        break;
      }
    }

    if (!added) {
      rows.push({
        texts: [txt],
        minY: txt.y - txt.height / 2,
        maxY: txt.y + txt.height / 2,
      });
    }
  }

  // 5. 각 행에서 품명 조합 및 수량 매칭
  console.log("=== 좌표 기반 파싱 (품명 열 기준) ===");

  for (const row of rows) {
    // X 좌표로 정렬하여 순서대로 조합
    row.texts.sort((a, b) => a.x - b.x);

    // 토큰들을 조합하면서 "(", "D", ")" 같은 패턴을 "(D)"로 합침
    const tokens: string[] = [];
    let i = 0;
    while (i < row.texts.length) {
      const current = row.texts[i].text;

      // "(", 단일문자, ")" 패턴 검사
      if (current === "(" && i + 2 < row.texts.length) {
        const next = row.texts[i + 1].text;
        const nextNext = row.texts[i + 2].text;
        if (/^[A-Z]$/.test(next) && nextNext === ")") {
          tokens.push(`(${next})`);
          i += 3;
          continue;
        }
      }

      // 단일 괄호나 단일 문자는 건너뜀 (이미 위에서 처리되거나 불필요한 경우)
      if (current === "(" || current === ")" || /^[A-Z]$/.test(current)) {
        i++;
        continue;
      }

      tokens.push(current);
      i++;
    }

    let itemName = tokens.join(" ");

    // (D), (S) 등의 옵션 정리 (혹시 남아있는 경우)
    itemName = itemName.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
    itemName = itemName.replace(/\s+/g, " ").trim();

    // 품명 유효성 검사
    if (!isValidItemName(itemName)) continue;

    // 같은 Y 좌표의 수량 찾기
    const rowCenterY = (row.minY + row.maxY) / 2;
    const tolerance = 50;

    const matchingQty = quantityTexts.find(q =>
      Math.abs(q.y - rowCenterY) < tolerance
    );

    const quantity = matchingQty ? parseInt(matchingQty.text, 10) : 0;

    // 사용된 수량 제거
    if (matchingQty) {
      const idx = quantityTexts.indexOf(matchingQty);
      quantityTexts.splice(idx, 1);
    }

    const wasQuantityCorrected = matchingQty?.wasCorrected || false;
    const originalQuantityText = matchingQty?.originalText;

    console.log(`품명: "${itemName}", 수량: ${quantity}${wasQuantityCorrected ? ` (원본: ${originalQuantityText})` : ""}, Y: ${Math.round(rowCenterY)}`);

    items.push({
      sequence: items.length + 1,
      name: itemName,
      quantity,
      unit: "EA",
      unitPrice: 0,
      amount: 0,
      raw: `${itemName}: ${quantity}`,
      originalQuantityText: wasQuantityCorrected ? originalQuantityText : undefined,
      wasQuantityCorrected,
    });
  }

  return items;
}

/**
 * 유효한 품명인지 확인
 */
function isValidItemName(text: string): boolean {
  const cleaned = text.replace(/\s*\([A-Z]\)\s*/g, "").replace(/\s+/g, "").trim();

  // 최소 2글자
  if (cleaned.length < 2) return false;

  // 제외 키워드
  const excluded = [
    "품명", "납품", "수량", "비고", "상호", "등록번호", "공급", "사업장", "거래",
    "담당자", "검수", "입회", "수거", "특이사항", "유한회사", "주식회사"
  ];

  for (const ex of excluded) {
    if (cleaned.includes(ex)) return false;
  }

  // 한글이 포함되어야 함
  return /[가-힣]/.test(cleaned);
}

/**
 * 품명 헤더를 찾지 못했을 때의 fallback
 */
function extractItemsFallback(annotations: TextAnnotation[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemCandidates: { text: string; y: number; x: number; height: number }[] = [];
  const quantityCandidates: { text: string; y: number; x: number; height: number }[] = [];

  let currentItemTokens: { text: string; y: number; x: number; height: number }[] = [];

  for (const ann of annotations) {
    const text = ann.text.trim();
    const centerY = ann.bounds.y + ann.bounds.height / 2;
    const x = ann.bounds.x;

    if (/^\d+$/.test(text)) {
      const num = parseInt(text, 10);
      if (num > 0 && num < 10000) {
        quantityCandidates.push({ text, y: centerY, x, height: ann.bounds.height });
      }
      if (currentItemTokens.length > 0) {
        const combinedText = currentItemTokens.map(t => t.text).join(" ");
        if (isItemNameText(combinedText)) {
          itemCandidates.push({
            text: combinedText,
            y: currentItemTokens[0].y,
            x: currentItemTokens[0].x,
            height: currentItemTokens[0].height,
          });
        }
        currentItemTokens = [];
      }
      continue;
    }

    if (/^[가-힣]+$/.test(text)) {
      const lastToken = currentItemTokens[currentItemTokens.length - 1];
      if (lastToken && Math.abs(lastToken.y - centerY) < lastToken.height * 0.5) {
        currentItemTokens.push({ text, y: centerY, x, height: ann.bounds.height });
      } else {
        if (currentItemTokens.length > 0) {
          const combinedText = currentItemTokens.map(t => t.text).join(" ");
          if (isItemNameText(combinedText)) {
            itemCandidates.push({
              text: combinedText,
              y: currentItemTokens[0].y,
              x: currentItemTokens[0].x,
              height: currentItemTokens[0].height,
            });
          }
        }
        currentItemTokens = [{ text, y: centerY, x, height: ann.bounds.height }];
      }
      continue;
    }

    if (currentItemTokens.length > 0) {
      const combinedText = currentItemTokens.map(t => t.text).join(" ");
      if (isItemNameText(combinedText)) {
        itemCandidates.push({
          text: combinedText,
          y: currentItemTokens[0].y,
          x: currentItemTokens[0].x,
          height: currentItemTokens[0].height,
        });
      }
      currentItemTokens = [];
    }
  }

  if (currentItemTokens.length > 0) {
    const combinedText = currentItemTokens.map(t => t.text).join(" ");
    if (isItemNameText(combinedText)) {
      itemCandidates.push({
        text: combinedText,
        y: currentItemTokens[0].y,
        x: currentItemTokens[0].x,
        height: currentItemTokens[0].height,
      });
    }
  }

  itemCandidates.sort((a, b) => a.y - b.y);

  for (const item of itemCandidates) {
    const tolerance = item.height * 1.5;
    const matchingQuantity = quantityCandidates.find(q =>
      Math.abs(q.y - item.y) < tolerance && q.x > item.x
    );
    const quantity = matchingQuantity ? parseInt(matchingQuantity.text, 10) : 0;
    if (matchingQuantity) {
      const idx = quantityCandidates.indexOf(matchingQuantity);
      quantityCandidates.splice(idx, 1);
    }

    let name = item.text;
    name = name.replace(/\s*\(\s*([A-Z])\s*\)\s*/, " ($1)");
    name = name.replace(/\s+/g, " ").trim();

    items.push({
      sequence: items.length + 1,
      name,
      quantity,
      unit: "EA",
      unitPrice: 0,
      amount: 0,
      raw: `${name}: ${quantity}`,
    });
  }

  return items;
}

/**
 * 품명인지 확인 (좌표 기반 파싱용)
 */
function isItemNameText(text: string): boolean {
  const cleaned = text.replace(/\s*\([A-Z]\)\s*/g, "").replace(/\s+/g, "").trim();

  // 알려진 품명 체크
  for (const name of KNOWN_ITEM_NAMES) {
    const nameNoSpace = name.replace(/\s+/g, "");
    if (cleaned.includes(nameNoSpace) || nameNoSpace.includes(cleaned)) return true;
  }

  // 제외 키워드
  const excluded = [
    "품명", "납품", "수량", "비고", "상호", "등록번호", "공급", "사업장", "거래",
    "담당자", "검수", "입회", "수거", "특이사항", "유한회사", "주식회사"
  ];
  for (const ex of excluded) {
    if (cleaned.includes(ex)) return false;
  }

  // 2글자 이상의 한글
  return cleaned.length >= 2;
}

/**
 * 품명인지 확인
 */
function isItemName(text: string): boolean {
  const cleaned = text.replace(/\s*\([A-Z]\)\s*/g, "").trim();

  // 알려진 품명 체크
  for (const name of KNOWN_ITEM_NAMES) {
    if (cleaned.includes(name)) return true;
  }

  // 한글 2글자 이상이고 세탁물 관련 키워드 포함
  if (/^[가-힣\s]+(\s*\([A-Z]\))?$/.test(text) && text.length >= 2) {
    const excluded = [
      // 헤더/라벨
      "품명", "납품", "수량", "비고", "상호", "등록번호", "공급", "사업장", "거래",
      "담당자", "검수", "입회", "수거", "특이사항",
      // 회사 관련
      "유한회사", "주식회사", "합자회사", "합명회사", "법인", "회사",
      // 주소 관련
      "시", "구", "동", "읍", "면", "리", "로", "길", "층", "호",
      "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
      "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
      // 기타
      "워싱", "클리닝", "세탁", "린넨", "서비스"
    ];
    for (const ex of excluded) {
      if (text.includes(ex)) return false;
    }
    return true;
  }

  return false;
}

/**
 * 수량인지 확인 (숫자만 있는 경우)
 */
function isQuantity(text: string): boolean {
  const cleaned = text.trim();
  // 순수 숫자이고 1-9999 범위
  return /^\d+$/.test(cleaned) && parseInt(cleaned, 10) > 0 && parseInt(cleaned, 10) < 10000;
}

/**
 * 라인들에서 품명과 수량을 추출하여 매칭
 */
function extractItemsFromLines(lines: Array<{ text: string; confidence: number }>): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemNames: string[] = [];
  const quantities: number[] = [];

  // 1단계: 품명과 수량을 각각 추출
  for (const line of lines) {
    const text = line.text.trim();

    // 같은 줄에 품명+수량이 있는 경우 (예: "침대시트 (D) 63")
    const combinedPattern = /^([가-힣]+(?:\s*타올)?(?:\s*커버)?(?:\s*시트)?)\s*(?:\(([A-Z])\))?\s+(\d+)\s*$/;
    const combinedMatch = text.match(combinedPattern);

    if (combinedMatch && isItemName(combinedMatch[1])) {
      const name = combinedMatch[2]
        ? `${combinedMatch[1].trim()} (${combinedMatch[2]})`
        : combinedMatch[1].trim();
      const quantity = parseInt(combinedMatch[3], 10);
      items.push({
        sequence: items.length + 1,
        name,
        quantity,
        unit: "EA",
        unitPrice: 0,
        amount: 0,
        raw: text,
      });
      continue;
    }

    // 품명만 있는 줄 (예: "침대시트 (D)")
    if (isItemName(text)) {
      // (D), (S) 등의 옵션 처리
      const optionMatch = text.match(/^(.+?)\s*\(([A-Z])\)\s*$/);
      if (optionMatch) {
        itemNames.push(`${optionMatch[1].trim()} (${optionMatch[2]})`);
      } else {
        itemNames.push(text);
      }
      continue;
    }

    // 수량만 있는 줄 (예: "63")
    if (isQuantity(text)) {
      quantities.push(parseInt(text, 10));
      continue;
    }
  }

  // 2단계: 품명과 수량 매칭 (이미 매칭된 items가 있으면 그것 사용)
  if (items.length === 0 && itemNames.length > 0) {
    const maxLen = Math.max(itemNames.length, quantities.length);
    for (let i = 0; i < maxLen; i++) {
      const name = itemNames[i] || `품목 ${i + 1}`;
      const quantity = quantities[i] || 0;

      items.push({
        sequence: i + 1,
        name,
        quantity,
        unit: "EA",
        unitPrice: 0,
        amount: 0,
        raw: `${name}: ${quantity}`,
      });
    }
  }

  return items;
}

/**
 * OCR 결과를 DB에 저장
 */
export interface SaveOcrResult {
  id: string;
  success: boolean;
  error?: string;
}

export async function saveOcrScan(
  ocrResult: OcrResult,
  parsedData: ParsedInvoice,
  provider: OcrProvider = "google",
  supplierId?: string,
  storeId?: string,
  imageUrl?: string
): Promise<SaveOcrResult> {
  try {
    // items를 DB에 저장할 형태로 변환
    const itemsForDb = parsedData.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      standardProductId: item.standardProductId || null,
      standardProductName: item.standardProductName || null,
    }));

    const { data, error } = await supabase
      .from("ocr_scans")
      .insert({
        provider: provider === "google" ? "google_vision" : "tesseract",
        confidence: ocrResult.confidence,
        raw_text: ocrResult.text,
        document_date: parsedData.date || null,
        supplier: parsedData.supplier || null,
        document_number: parsedData.documentNumber || null,
        items: itemsForDb,
        supplier_id: supplierId || null,
        store_id: storeId || null,
        image_url: imageUrl || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("OCR 저장 오류:", error);
      return { id: "", success: false, error: error.message };
    }

    return { id: data.id, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("OCR 저장 오류:", errorMessage);
    return { id: "", success: false, error: errorMessage };
  }
}

/**
 * OCR 스캔 조회 필터
 */
export interface OcrScanFilters {
  supplierId?: string;
  storeId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * OCR 스캔 조회 결과 타입
 */
export interface OcrScanRecord {
  id: string;
  provider: string;
  confidence: number;
  rawText: string;
  documentDate: string | null;
  supplier: string | null;
  documentNumber: string | null;
  items: Array<{ name: string; quantity: number; unit: string; standardProductId?: string; standardProductName?: string }>;
  supplierId: string | null;
  storeId: string | null;
  supplierName: string | null;
  storeName: string | null;
  imageUrl: string | null;
  createdAt: string;
}

/**
 * 저장된 OCR 스캔 목록 조회
 */
export async function getOcrScans(filters: OcrScanFilters = {}): Promise<OcrScanRecord[]> {
  const { supplierId, storeId, startDate, endDate, limit = 50 } = filters;

  let query = supabase
    .from("ocr_scans")
    .select(`
      *,
      suppliers:supplier_id (name),
      stores:store_id (name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  // 필터 적용
  if (supplierId) {
    query = query.eq("supplier_id", supplierId);
  }
  if (storeId) {
    query = query.eq("store_id", storeId);
  }
  if (startDate) {
    query = query.gte("document_date", startDate);
  }
  if (endDate) {
    query = query.lte("document_date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("OCR 조회 오류:", error);
    return [];
  }

  // DB 결과를 타입에 맞게 변환
  return data.map((row) => ({
    id: row.id,
    provider: row.provider,
    confidence: row.confidence,
    rawText: row.raw_text,
    documentDate: row.document_date,
    supplier: row.supplier,
    documentNumber: row.document_number,
    items: row.items || [],
    supplierId: row.supplier_id,
    storeId: row.store_id,
    supplierName: row.suppliers?.name || null,
    storeName: row.stores?.name || null,
    imageUrl: row.image_url || null,
    createdAt: row.created_at,
  }));
}
