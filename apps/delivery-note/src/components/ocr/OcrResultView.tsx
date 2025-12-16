"use client";

import { CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import type { ParsedInvoice, ParsedItem } from "@/lib/ocr";
import { useState } from "react";

interface OcrResultViewProps {
  parsedInvoice: ParsedInvoice;
  rawText: string;
  confidence: number;
  onItemUpdate?: (index: number, item: ParsedItem) => void;
}

export function OcrResultView({
  parsedInvoice,
  rawText,
  confidence,
  onItemUpdate,
}: OcrResultViewProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 안전하게 items 배열 처리
  const items = parsedInvoice?.items ?? [];

  return (
    <div className="space-y-4">
      {/* 요약 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">OCR 결과</CardTitle>
            <div className="flex items-center gap-2">
              {confidence >= 80 ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm text-muted-foreground">
                신뢰도 {confidence.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">거래일자</p>
              <p className="font-medium">{parsedInvoice.date || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">거래처</p>
              <p className="font-medium">{parsedInvoice.supplier || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">품목 수</p>
              <p className="font-medium">{items.length}개</p>
            </div>
            <div>
              <p className="text-muted-foreground">총액</p>
              <p className="font-medium">
                {parsedInvoice.totalAmount
                  ? formatNumber(parsedInvoice.totalAmount) + "원"
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 품목 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">추출된 품목</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              추출된 품목이 없습니다. 이미지를 확인해주세요.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium w-10">#</th>
                    <th className="text-left py-2 px-2 font-medium">품명</th>
                    <th className="text-center py-2 px-2 font-medium w-20">수량</th>
                    <th className="text-right py-2 px-2 font-medium w-24">단가</th>
                    <th className="text-right py-2 px-2 font-medium w-28">금액</th>
                    <th className="text-center py-2 px-2 font-medium w-16">수정</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-2 text-muted-foreground">
                        {item.sequence}
                      </td>
                      <td className="py-2 px-2">
                        {editingIndex === index ? (
                          <Input
                            defaultValue={item.name}
                            className="h-8"
                            onBlur={(e) => {
                              onItemUpdate?.(index, { ...item, name: e.target.value });
                              setEditingIndex(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono text-xs">{item.name}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">{item.quantity}</td>
                      <td className="py-2 px-2 text-right">
                        {formatNumber(item.unitPrice)}
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {formatNumber(item.amount)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingIndex(index)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 원본 텍스트 토글 */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRawText(!showRawText)}
        >
          {showRawText ? "원본 텍스트 숨기기" : "원본 텍스트 보기"}
        </Button>
        {showRawText && (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-64">
                {rawText}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
