import Tesseract from "tesseract.js";
import type { OcrApiResponse } from "@/app/api/ocr/route";
import type { OcrProvider } from "@/stores/settingsStore";
import { supabase } from "@/lib/supabase";

export interface OcrResult {
  text: string;
  confidence: number;
  lines: Array<{
    text: string;
    confidence: number;
  }>;
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

  return result.data;
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
  supplier?: string;
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

  // 공급자 상호 추출
  let supplier: string | undefined;
  const supplierMatch = text.match(/상\s*호[:\s]*([^\n]+)/);
  if (supplierMatch) {
    supplier = supplierMatch[1].trim().split(/\s{2,}/)[0];
  }

  // 등록번호 추출
  let documentNumber: string | undefined;
  const regNumMatch = text.match(/등록번호[:\s]*([\d-]+)/);
  if (regNumMatch) {
    documentNumber = regNumMatch[1];
  }

  // 품명과 수량을 별도로 추출 후 매칭
  const items = extractItemsFromLines(lines);

  const result: ParsedInvoice = {
    date,
    supplier,
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
  provider: OcrProvider = "google"
): Promise<SaveOcrResult> {
  try {
    // items를 DB에 저장할 형태로 변환
    const itemsForDb = parsedData.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
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
 * 저장된 OCR 스캔 목록 조회
 */
export async function getOcrScans(limit = 20) {
  const { data, error } = await supabase
    .from("ocr_scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("OCR 조회 오류:", error);
    return [];
  }

  return data;
}
