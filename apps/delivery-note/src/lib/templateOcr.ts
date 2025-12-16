import Tesseract from "tesseract.js";
import type { Template, TemplateRegion } from "@/types/template";
import type { OcrApiResponse } from "@/app/api/ocr/route";
import type { OcrProvider } from "@/stores/settingsStore";
import { preprocessForNumbers, preprocessForText } from "./imagePreprocess";

export interface RegionOcrResult {
  region: TemplateRegion;
  text: string;
  confidence: number;
  lines: string[];
}

export interface TemplateOcrResult {
  template: Template;
  regions: RegionOcrResult[];
  parsedData: {
    date?: string;
    supplier?: string;
    items: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

/**
 * 이미지에서 특정 영역을 크롭하여 Canvas에 그립니다
 */
async function cropImageRegion(
  imageSource: string,
  region: TemplateRegion
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      // 영역 좌표 계산 (% -> px)
      const x = (region.x / 100) * img.width;
      const y = (region.y / 100) * img.height;
      const width = (region.width / 100) * img.width;
      const height = (region.height / 100) * img.height;

      // Canvas 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 영역 크롭
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      // Data URL로 변환
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSource;
  });
}

/**
 * Google Vision API로 특정 영역 OCR 수행
 */
async function ocrRegionWithGoogleVision(
  imageSource: string,
  region: TemplateRegion,
  onProgress?: (progress: number) => void
): Promise<RegionOcrResult> {
  // 영역 크롭
  const croppedImage = await cropImageRegion(imageSource, region);

  onProgress?.(30);

  // 서버 API 호출
  const response = await fetch("/api/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: croppedImage }),
  });

  onProgress?.(80);

  const result: OcrApiResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error ?? "OCR 처리에 실패했습니다.");
  }

  onProgress?.(100);

  const text = result.data.text?.trim() ?? "";
  const lines = parseLines(text, region.type);

  console.log(`[Google Vision] Region "${region.name}" (${region.type}) - OCR 완료`);

  return {
    region,
    text,
    confidence: result.data.confidence ?? 0,
    lines,
  };
}

/**
 * Tesseract.js로 특정 영역 OCR 수행
 */
async function ocrRegionWithTesseract(
  imageSource: string,
  region: TemplateRegion,
  onProgress?: (progress: number) => void
): Promise<RegionOcrResult> {
  // 영역 크롭
  const croppedImage = await cropImageRegion(imageSource, region);

  // 영역 타입에 따라 다른 전처리 적용
  let processedImage: string;

  if (region.type === "quantity") {
    processedImage = await preprocessForNumbers(croppedImage);
  } else if (region.type === "product_name") {
    processedImage = await preprocessForText(croppedImage);
  } else {
    processedImage = await preprocessForText(croppedImage);
  }

  console.log(`[Tesseract] Region "${region.name}" (${region.type}) - 전처리 완료`);

  const result = await Tesseract.recognize(processedImage, "kor+eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text?.trim() ?? "";
  const lines = parseLines(text, region.type);

  return {
    region,
    text,
    confidence: result.data.confidence ?? 0,
    lines,
  };
}

/**
 * 텍스트를 라인으로 파싱
 */
function parseLines(text: string, regionType: string): string[] {
  if (regionType === "quantity") {
    return text
      .split("\n")
      .map((line) => {
        const numbers = line.match(/\d+/g);
        return numbers ? numbers.join("") : "";
      })
      .filter((line) => line.length > 0);
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * 특정 영역에 대해 OCR 수행
 */
async function ocrRegion(
  imageSource: string,
  region: TemplateRegion,
  provider: OcrProvider,
  onProgress?: (progress: number) => void
): Promise<RegionOcrResult> {
  if (provider === "google") {
    return ocrRegionWithGoogleVision(imageSource, region, onProgress);
  } else {
    return ocrRegionWithTesseract(imageSource, region, onProgress);
  }
}

/**
 * 템플릿의 모든 영역에 대해 OCR 수행
 */
export async function performTemplateOcr(
  imageSource: string,
  template: Template,
  provider: OcrProvider = "tesseract",
  onProgress?: (regionIndex: number, progress: number) => void
): Promise<TemplateOcrResult> {
  const regionResults: RegionOcrResult[] = [];

  // 각 영역별로 OCR 수행
  for (let i = 0; i < template.regions.length; i++) {
    const region = template.regions[i];
    const result = await ocrRegion(
      imageSource,
      region,
      provider,
      (progress) => {
        onProgress?.(i, progress);
      }
    );
    regionResults.push(result);
  }

  // 결과 파싱
  const parsedData = parseRegionResults(regionResults);

  return {
    template,
    regions: regionResults,
    parsedData,
  };
}

/**
 * 영역별 OCR 결과를 파싱하여 구조화된 데이터로 변환
 */
function parseRegionResults(results: RegionOcrResult[]) {
  let date: string | undefined;
  let supplier: string | undefined;
  const items: Array<{ name: string; quantity: number }> = [];

  // 품명 영역과 수량 영역 찾기
  const productNameRegion = results.find((r) => r.region.type === "product_name");
  const quantityRegion = results.find((r) => r.region.type === "quantity");
  const dateRegion = results.find((r) => r.region.type === "date");
  const supplierRegion = results.find((r) => r.region.type === "supplier");

  // 날짜 추출
  if (dateRegion) {
    const dateMatch = dateRegion.text.match(/(\d{4})\s*[년./-]\s*(\d{1,2})\s*[월./-]\s*(\d{1,2})/);
    if (dateMatch) {
      date = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
    }
  }

  // 거래처 추출
  if (supplierRegion) {
    supplier = supplierRegion.lines[0] || supplierRegion.text.split("\n")[0];
  }

  // 품명과 수량 매칭
  if (productNameRegion && quantityRegion) {
    const names = productNameRegion.lines;
    const quantities = quantityRegion.lines;

    // 라인 수가 같으면 1:1 매칭
    const maxLen = Math.max(names.length, quantities.length);

    for (let i = 0; i < maxLen; i++) {
      const name = names[i] || "";
      const qtyText = quantities[i] || "";

      // 수량에서 숫자 추출
      const qtyMatch = qtyText.match(/\d+/);
      const quantity = qtyMatch ? parseInt(qtyMatch[0], 10) : 0;

      // 유효한 품명인지 체크
      if (name && name.length >= 2 && !isHeaderText(name)) {
        items.push({ name, quantity });
      }
    }
  }

  console.log("=== 템플릿 OCR 파싱 결과 ===");
  console.log(JSON.stringify({ date, supplier, items }, null, 2));

  return { date, supplier, items };
}

/**
 * 헤더 텍스트인지 확인
 */
function isHeaderText(text: string): boolean {
  const headers = ["품명", "품 명", "납품수량", "수량", "비고", "특이사항"];
  return headers.some((h) => text.includes(h));
}
