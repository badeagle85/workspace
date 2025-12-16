"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTemplateStore } from "@/stores/templateStore";
import { TemplateEditor } from "@/components/template/TemplateEditor";
import { DropZone } from "@/components/upload/DropZone";
import { useUploadStore } from "@/stores/uploadStore";
import { formatDateTime } from "@/lib/utils";

type ViewMode = "list" | "create" | "edit";

export default function TemplatesPage() {
  const { templates, deleteTemplate } = useTemplateStore();
  const { files, clearFiles } = useUploadStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const handleStartCreate = () => {
    clearFiles();
    setViewMode("create");
    setImageUrl(null);
  };

  const handleImageSelected = () => {
    if (files.length > 0 && files[0].file) {
      const url = URL.createObjectURL(files[0].file);
      setImageUrl(url);
    }
  };

  const handleSaveTemplate = (templateId: string) => {
    setViewMode("list");
    setImageUrl(null);
    clearFiles();
    alert("템플릿이 저장되었습니다!");
  };

  const handleCancel = () => {
    setViewMode("list");
    setImageUrl(null);
    clearFiles();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" 템플릿을 삭제하시겠습니까?`)) {
      deleteTemplate(id);
    }
  };

  // 템플릿 생성 모드
  if (viewMode === "create") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">새 템플릿 등록</h1>
            <p className="text-muted-foreground mt-1">
              거래명세서 이미지를 업로드하고 영역을 지정하세요.
            </p>
          </div>
        </div>

        {!imageUrl ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. 샘플 이미지 업로드</CardTitle>
              </CardHeader>
              <CardContent>
                <DropZone />
              </CardContent>
            </Card>

            {files.length > 0 && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCancel}>
                  취소
                </Button>
                <Button onClick={handleImageSelected}>
                  다음 단계로
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. 영역 지정</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  이미지에서 품명, 수량 등 추출할 영역을 드래그하여 지정하세요.
                </p>
              </CardContent>
            </Card>

            <TemplateEditor
              imageUrl={imageUrl}
              onSave={handleSaveTemplate}
              onCancel={handleCancel}
            />
          </>
        )}
      </div>
    );
  }

  // 템플릿 목록
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">템플릿 관리</h1>
          <p className="text-muted-foreground mt-1">
            거래명세서 양식별 템플릿을 등록하고 관리합니다.
          </p>
        </div>
        <Button onClick={handleStartCreate}>
          <Plus className="w-4 h-4 mr-2" />
          새 템플릿 등록
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              등록된 템플릿이 없습니다.
            </p>
            <Button onClick={handleStartCreate}>
              <Plus className="w-4 h-4 mr-2" />
              첫 번째 템플릿 등록하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              {/* 샘플 이미지 */}
              {template.sampleImageUrl && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={template.sampleImageUrl}
                    alt={template.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}

              <CardHeader className="pb-2">
                <CardTitle className="text-base">{template.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* 키워드 */}
                {template.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-0.5 bg-secondary rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {/* 영역 정보 */}
                <p className="text-sm text-muted-foreground">
                  {template.regions.length}개 영역 지정됨
                </p>

                {/* 날짜 */}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(template.createdAt)}
                </p>

                {/* 액션 버튼 */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(template.id, template.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
