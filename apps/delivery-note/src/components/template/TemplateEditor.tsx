"use client";

import { useState } from "react";
import { Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionSelector } from "./RegionSelector";
import { useTemplateStore } from "@/stores/templateStore";
import { cn } from "@/lib/utils";
import type { TemplateRegion, CreateTemplateInput } from "@/types/template";

interface TemplateEditorProps {
  imageUrl: string;
  onSave?: (templateId: string) => void;
  onCancel?: () => void;
}

const REGION_TYPES: { type: TemplateRegion["type"]; label: string; color: string }[] = [
  { type: "product_name", label: "품명", color: "bg-blue-500" },
  { type: "quantity", label: "수량", color: "bg-green-500" },
  { type: "date", label: "날짜", color: "bg-purple-500" },
  { type: "supplier", label: "거래처", color: "bg-orange-500" },
  { type: "unit_price", label: "단가", color: "bg-pink-500" },
  { type: "amount", label: "금액", color: "bg-red-500" },
];

export function TemplateEditor({ imageUrl, onSave, onCancel }: TemplateEditorProps) {
  const { addTemplate } = useTemplateStore();

  const [templateName, setTemplateName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [regions, setRegions] = useState<Omit<TemplateRegion, "id">[]>([]);
  const [selectedType, setSelectedType] = useState<TemplateRegion["type"]>("product_name");

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    if (regions.length === 0) {
      alert("최소 1개 이상의 영역을 지정해주세요.");
      return;
    }

    const input: CreateTemplateInput = {
      name: templateName,
      keywords,
      regions,
      sampleImageUrl: imageUrl,
    };

    const template = addTemplate(input);
    onSave?.(template.id);
  };

  return (
    <div className="space-y-6">
      {/* 템플릿 정보 입력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">템플릿 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 템플릿 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">템플릿 이름 *</label>
            <Input
              placeholder="예: 우성 워싱웨이 거래명세서"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          {/* 키워드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              인식 키워드 (자동 매칭용)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="예: 우성, 워싱웨이"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button variant="outline" onClick={handleAddKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 영역 타입 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">영역 타입 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REGION_TYPES.map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all",
                  selectedType === type
                    ? `${color} text-white`
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            선택한 타입으로 이미지 위에서 드래그하여 영역을 지정하세요.
          </p>
        </CardContent>
      </Card>

      {/* 이미지 영역 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            영역 지정 ({regions.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[600px] border rounded-lg">
            <RegionSelector
              imageUrl={imageUrl}
              regions={regions}
              onRegionsChange={setRegions}
              selectedRegionType={selectedType}
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          템플릿 저장
        </Button>
      </div>
    </div>
  );
}
