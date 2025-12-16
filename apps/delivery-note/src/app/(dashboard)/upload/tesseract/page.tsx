"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, RotateCcw, LayoutTemplate, Edit3 } from "lucide-react";
import Link from "next/link";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadStore } from "@/stores/uploadStore";
import { useTemplateStore } from "@/stores/templateStore";
import { performTemplateOcr, type TemplateOcrResult } from "@/lib/templateOcr";
import type { Template } from "@/types/template";

type ProcessMode = "template" | "manual";

export default function TesseractUploadPage() {
  const { files, clearFiles } = useUploadStore();
  const { templates } = useTemplateStore();

  const [mode, setMode] = useState<ProcessMode>("template");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ region: 0, percent: 0 });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [ocrResult, setOcrResult] = useState<TemplateOcrResult | null>(null);
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

  const handleTemplateOcr = async () => {
    if (!imageUrl || !selectedTemplate) return;

    setIsProcessing(true);
    setError(null);
    setProgress({ region: 0, percent: 0 });

    try {
      const result = await performTemplateOcr(
        imageUrl,
        selectedTemplate,
        "tesseract",
        (regionIndex, percent) => {
          setProgress({ region: regionIndex + 1, percent });
        }
      );
      setOcrResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setOcrResult(null);
    setSelectedTemplate(null);
    setImageUrl(null);
    setError(null);
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
            <h1 className="text-2xl font-bold">Tesseract.js OCR</h1>
            <p className="text-muted-foreground mt-1">
              템플릿 기반으로 텍스트를 추출합니다
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
                  onClick={() => setMode("template")}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    mode === "template"
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <LayoutTemplate className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">템플릿 기반</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    등록된 템플릿으로 자동 인식
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

          {/* 템플릿 모드: 템플릿 선택 */}
          {mode === "template" && hasFiles && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">템플릿 선택</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      등록된 템플릿이 없습니다.
                    </p>
                    <Link href="/templates">
                      <Button>
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        템플릿 등록하기
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate?.id === template.id
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                        }`}
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.regions.length}개 영역 · {template.keywords.join(", ")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      영역 {progress.region} / {selectedTemplate?.regions.length || 0} 처리 중...
                    </span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
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
          {mode === "template" && hasFiles && selectedTemplate && !isProcessing && (
            <div className="flex justify-end">
              <Button size="lg" onClick={handleTemplateOcr}>
                OCR 처리 시작
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
      {ocrResult && (
        <OcrResultCard result={ocrResult} onReset={handleReset} imageUrl={imageUrl} />
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
  result,
  onReset,
  imageUrl,
}: {
  result: TemplateOcrResult;
  onReset: () => void;
  imageUrl: string | null;
}) {
  const { parsedData } = result;

  const [editableItems, setEditableItems] = useState<Array<{ name: string; quantity: string }>>(
    parsedData.items.map(item => ({
      name: item.name,
      quantity: item.quantity > 0 ? String(item.quantity) : "",
    }))
  );

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

  const emptyQuantityCount = editableItems.filter(item => !item.quantity).length;

  return (
    <>
      {imageUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">원본 이미지</CardTitle>
            <CardDescription>
              이미지를 참고하여 수량을 입력하세요
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
            템플릿: {result.template.name}
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
              <span className="text-muted-foreground font-normal ml-2">
                - 품명은 OCR로 추출, 수량은 직접 입력
              </span>
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
                      !item.quantity ? "border-orange-300 bg-orange-50" : ""
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
              영역별 OCR 원본 보기
            </summary>
            <div className="mt-2 space-y-2">
              {result.regions.map((r, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-xs mb-1">
                    {r.region.name} (신뢰도: {r.confidence.toFixed(1)}%)
                  </p>
                  <pre className="text-xs whitespace-pre-wrap">{r.text || "(텍스트 없음)"}</pre>
                </div>
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onReset}>
          다시 업로드
        </Button>
        <Button disabled={emptyQuantityCount > 0}>
          품명 변환하기
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </>
  );
}
