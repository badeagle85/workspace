"use client";

import { useState, useCallback } from "react";
import { extractTextFromImage, parseInvoiceText, type OcrResult, type ParsedInvoice } from "@/lib/ocr";
import { useSettingsStore } from "@/stores/settingsStore";

interface UseOcrReturn {
  isProcessing: boolean;
  progress: number;
  result: OcrResult | null;
  parsedInvoice: ParsedInvoice | null;
  error: string | null;
  processImage: (file: File) => Promise<void>;
  reset: () => void;
}

export function useOcr(): UseOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [parsedInvoice, setParsedInvoice] = useState<ParsedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ocrProvider = useSettingsStore((state) => state.ocrProvider);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setParsedInvoice(null);

    try {
      // 파일을 Data URL로 변환
      const imageUrl = await fileToDataUrl(file);

      // OCR 실행 (설정된 제공자 사용)
      const ocrResult = await extractTextFromImage(imageUrl, ocrProvider, (p) => {
        setProgress(p);
      });

      setResult(ocrResult);

      // 거래명세서 파싱
      const parsed = parseInvoiceText(ocrResult);
      setParsedInvoice(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  }, [ocrProvider]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setResult(null);
    setParsedInvoice(null);
    setError(null);
  }, []);

  return {
    isProcessing,
    progress,
    result,
    parsedInvoice,
    error,
    processImage,
    reset,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
