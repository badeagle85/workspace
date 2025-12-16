"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, RotateCcw, Edit3, Scan, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadStore } from "@/stores/uploadStore";
import { useGoogleVisionUsage, GOOGLE_VISION_MONTHLY_LIMIT } from "@/hooks/useApiUsage";
import { extractTextFromImage, parseInvoiceText, saveOcrScan, type OcrResult, type ParsedInvoice } from "@/lib/ocr";

type ProcessMode = "auto" | "manual";

export default function GoogleUploadPage() {
  const { files, clearFiles } = useUploadStore();
  const { remaining, limitReached, increment, isLoading: isUsageLoading } = useGoogleVisionUsage();

  const [mode, setMode] = useState<ProcessMode>("auto");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [parsedData, setParsedData] = useState<ParsedInvoice | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasFiles = files.length > 0;
  const firstFile = files[0];

  useEffect(() => {
    if (firstFile?.file) {
      const url = URL.createObjectURL(firstFile.file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [firstFile]);

  const handleOcr = async () => {
    if (!firstFile?.file) return;

    // 사용량 체크 및 증가
    const result = await increment();
    if (!result.success) {
      setError(`이번 달 사용 한도(${GOOGLE_VISION_MONTHLY_LIMIT}건)에 도달했습니다. 다음 달에 다시 이용해주세요.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const ocrResult = await extractTextFromImage(
        firstFile.file,
        "google",
        (percent) => setProgress(percent)
      );
      setOcrResult(ocrResult);
      setParsedData(parseInvoiceText(ocrResult));
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOcrResult(null);
    setParsedData(null);
    setImageUrl(null);
    setError(null);
    setProgress(0);
    clearFiles();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/upload">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Google Vision OCR</h1>
            <p className="text-muted-foreground mt-1">
              이미지에서 자동으로 텍스트를 추출합니다
            </p>
          </div>
        </div>
        {(hasFiles || ocrResult) && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        )}
      </div>

      {/* 사용량 표시 */}
      {!isUsageLoading && (
        <div className={`p-4 rounded-lg border ${
          limitReached
            ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
            : remaining <= 100
              ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900"
              : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {limitReached && <AlertTriangle className="w-4 h-4 text-red-500" />}
              <span className="text-sm font-medium">
                이번 달 남은 사용량
              </span>
            </div>
            <span className={`text-lg font-bold ${
              limitReached
                ? "text-red-600"
                : remaining <= 100
                  ? "text-orange-600"
                  : "text-blue-600"
            }`}>
              {remaining} / {GOOGLE_VISION_MONTHLY_LIMIT}건
            </span>
          </div>
          {limitReached && (
            <p className="text-xs text-red-600 mt-2">
              이번 달 무료 한도에 도달했습니다. 다음 달 1일에 자동으로 초기화됩니다.
            </p>
          )}
        </div>
      )}

      {!ocrResult && (
        <>
          {/* 모드 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">처리 방식 선택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("auto")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    mode === "auto"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <Scan className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">자동 인식</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Google Vision으로 자동 추출
                  </p>
                </button>
                <button
                  onClick={() => setMode("manual")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    mode === "manual"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <Edit3 className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">수동 입력</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    직접 품목 정보 입력
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 업로드 영역 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">이미지 업로드</CardTitle>
              <CardDescription>
                JPG, PNG 형식의 파일을 업로드할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DropZone />
            </CardContent>
          </Card>

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Google Vision API 처리 중...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Process Button */}
          {mode === "auto" && hasFiles && !isProcessing && (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleOcr} disabled={limitReached}>
                {limitReached ? "한도 도달" : "OCR 처리 시작"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* 수동 입력 모드 */}
          {mode === "manual" && hasFiles && (
            <ManualInputForm imageUrl={imageUrl} />
          )}
        </>
      )}

      {/* OCR 결과 */}
      {ocrResult && parsedData && (
        <OcrResultCard
          ocrResult={ocrResult}
          parsedData={parsedData}
          onReset={handleReset}
          imageUrl={imageUrl}
        />
      )}
    </div>
  );
}

function ManualInputForm({ imageUrl }: { imageUrl: string | null }) {
  const [items, setItems] = useState<Array<{ name: string; quantity: string }>>([
    { name: "", quantity: "" },
  ]);

  const addItem = () => {
    setItems([...items, { name: "", quantity: "" }]);
  };

  const updateItem = (index: number, field: "name" | "quantity", value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">품목 직접 입력</CardTitle>
        <CardDescription>
          거래명세서를 보면서 품명과 수량을 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl && (
          <div className="border rounded-lg overflow-hidden max-h-64">
            <img src={imageUrl} alt="거래명세서" className="w-full object-contain" />
          </div>
        )}

        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="품명"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="number"
                placeholder="수량"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                className="w-24 px-3 py-2 border rounded-md text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addItem} className="w-full">
          + 품목 추가
        </Button>

        <div className="flex justify-end">
          <Button>
            저장하기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OcrResultCard({
  ocrResult,
  parsedData,
  onReset,
  imageUrl,
}: {
  ocrResult: OcrResult;
  parsedData: ParsedInvoice;
  onReset: () => void;
  imageUrl: string | null;
}) {
  const [editableItems, setEditableItems] = useState<Array<{ name: string; quantity: string }>>(
    parsedData.items.length > 0
      ? parsedData.items.map(item => ({
          name: item.name,
          quantity: item.quantity > 0 ? String(item.quantity) : "",
        }))
      : [{ name: "", quantity: "" }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateItem = (index: number, field: "name" | "quantity", value: string) => {
    const newItems = [...editableItems];
    newItems[index][field] = value;
    setEditableItems(newItems);
  };

  const removeItem = (index: number) => {
    if (editableItems.length > 1) {
      setEditableItems(editableItems.filter((_, i) => i !== index));
    }
  };

  const addItem = () => {
    setEditableItems([...editableItems, { name: "", quantity: "" }]);
  };

  const emptyQuantityCount = editableItems.filter(item => item.name && !item.quantity).length;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    // 편집된 items로 parsedData 업데이트
    const updatedParsedData: ParsedInvoice = {
      ...parsedData,
      items: editableItems
        .filter(item => item.name.trim())
        .map((item, index) => ({
          sequence: index + 1,
          name: item.name,
          quantity: parseInt(item.quantity, 10) || 0,
          unit: "EA",
          unitPrice: 0,
          amount: 0,
          raw: `${item.name}: ${item.quantity}`,
        })),
    };

    const result = await saveOcrScan(ocrResult, updatedParsedData, "google");

    if (result.success) {
      setSaveSuccess(true);
    } else {
      setSaveError(result.error || "저장에 실패했습니다.");
    }

    setIsSaving(false);
  };

  return (
    <>
      {imageUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">원본 이미지</CardTitle>
            <CardDescription>
              이미지를 참고하여 결과를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden max-h-80">
              <img src={imageUrl} alt="거래명세서" className="w-full object-contain" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">추출 결과 편집</CardTitle>
          <CardDescription>
            신뢰도: {ocrResult.confidence.toFixed(1)}%
            {emptyQuantityCount > 0 && (
              <span className="text-orange-500 ml-2">
                (수량 미입력: {emptyQuantityCount}개)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">날짜</p>
              <p className="font-medium">{parsedData.date || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">거래처</p>
              <p className="font-medium">{parsedData.supplier || "-"}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              품목 목록 ({editableItems.length}개)
            </p>

            <div className="space-y-2">
              {editableItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="w-8 text-sm text-muted-foreground text-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder="품명"
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    placeholder="수량"
                    className={`w-24 px-3 py-2 border rounded-md text-sm text-right ${
                      item.name && !item.quantity ? "border-orange-300 bg-orange-50" : ""
                    }`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={editableItems.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addItem} className="w-full mt-3">
              + 품목 추가
            </Button>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              OCR 원본 텍스트 보기
            </summary>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <pre className="text-xs whitespace-pre-wrap">{ocrResult.text || "(텍스트 없음)"}</pre>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* 저장 결과 메시지 */}
      {saveError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{saveError}</p>
          </CardContent>
        </Card>
      )}

      {saveSuccess && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">저장되었습니다!</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReset}>
          다시 업로드
        </Button>
        <Button
          onClick={handleSave}
          disabled={emptyQuantityCount > 0 || isSaving || saveSuccess}
        >
          {isSaving ? "저장 중..." : saveSuccess ? "저장 완료" : "저장하기"}
          {!isSaving && !saveSuccess && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </>
  );
}
