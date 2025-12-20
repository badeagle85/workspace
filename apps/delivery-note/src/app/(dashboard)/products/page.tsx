"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getStandardProducts,
  createStandardProduct,
  updateStandardProduct,
  deleteStandardProduct,
} from "@/lib/products";
import type { StandardProduct } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<StandardProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    unit: "EA",
  });

  // 데이터 로드
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const data = await getStandardProducts();
    setProducts(data);
    setIsLoading(false);
  }

  // 폼 초기화
  function resetForm() {
    setFormData({ name: "", category: "", unit: "EA" });
    setEditingId(null);
    setIsAdding(false);
  }

  // 추가 시작
  function handleAdd() {
    resetForm();
    setIsAdding(true);
  }

  // 수정 시작
  function handleEdit(product: StandardProduct) {
    setFormData({
      name: product.name,
      category: product.category || "",
      unit: product.unit,
    });
    setEditingId(product.id);
    setIsAdding(false);
  }

  // 저장
  async function handleSave() {
    if (!formData.name.trim()) {
      alert("품목명을 입력해주세요.");
      return;
    }

    try {
      if (editingId) {
        // 수정
        await updateStandardProduct(editingId, {
          name: formData.name.trim(),
          category: formData.category.trim() || undefined,
          unit: formData.unit,
        });
      } else {
        // 추가
        await createStandardProduct({
          name: formData.name.trim(),
          category: formData.category.trim() || undefined,
          unit: formData.unit,
          sortOrder: products.length,
          isActive: true,
        });
      }
      resetForm();
      loadProducts();
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  // 삭제
  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const success = await deleteStandardProduct(id);
    if (success) {
      loadProducts();
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">표준 품목 관리</h1>
            <p className="text-muted-foreground">
              OCR 결과를 변환할 표준 품목을 등록합니다
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={isAdding || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          품목 추가
        </Button>
      </div>

      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingId ? "품목 수정" : "새 품목 추가"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="품목명 (예: 수건)"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                placeholder="카테고리 (선택)"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-40"
              />
              <Input
                placeholder="단위"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-24"
              />
              <Button onClick={handleSave}>저장</Button>
              <Button variant="outline" onClick={resetForm}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 품목 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 품목 ({products.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 품목이 없습니다. 품목을 추가해주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground w-8 text-center">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {product.category && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          [{product.category}]
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground mr-4">
                      {product.unit}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                      disabled={isAdding || editingId !== null}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={isAdding || editingId !== null}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
