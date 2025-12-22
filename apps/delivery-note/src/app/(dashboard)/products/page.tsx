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

  // 새 품목 추가 폼 상태
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    unit: "EA",
  });

  // 수정 폼 상태
  const [editFormData, setEditFormData] = useState({
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

  // 수정 취소
  function cancelEdit() {
    setEditingId(null);
    setEditFormData({ name: "", category: "", unit: "EA" });
  }

  // 수정 시작
  function handleEdit(product: StandardProduct) {
    setEditFormData({
      name: product.name,
      category: product.category || "",
      unit: product.unit,
    });
    setEditingId(product.id);
  }

  // 새 품목 추가
  async function handleAddNew() {
    if (!newProduct.name.trim()) {
      return;
    }

    try {
      await createStandardProduct({
        name: newProduct.name.trim(),
        category: newProduct.category.trim() || undefined,
        unit: newProduct.unit,
        sortOrder: products.length,
        isActive: true,
      });
      setNewProduct({ name: "", category: "", unit: "EA" });
      loadProducts();
    } catch (error) {
      alert(error instanceof Error ? error.message : "추가에 실패했습니다.");
    }
  }

  // 수정 저장
  async function handleSaveEdit() {
    if (!editFormData.name.trim() || !editingId) {
      return;
    }

    try {
      await updateStandardProduct(editingId, {
        name: editFormData.name.trim(),
        category: editFormData.category.trim() || undefined,
        unit: editFormData.unit,
      });
      cancelEdit();
      loadProducts();
    } catch (error) {
      alert(error instanceof Error ? error.message : "수정에 실패했습니다.");
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
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">표준 품목 관리</h1>
          <p className="text-muted-foreground">
            OCR 결과를 변환할 표준 품목을 등록합니다
          </p>
        </div>
      </div>

      {/* 새 품목 추가 폼 - 항상 노출 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>새 품목 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="품목명 (예: 수건)"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
              className="flex-1"
            />
            <Input
              placeholder="카테고리 (선택)"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
              className="w-40"
            />
            <Input
              placeholder="단위"
              value={newProduct.unit}
              onChange={(e) =>
                setNewProduct({ ...newProduct, unit: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && handleAddNew()}
              className="w-24"
            />
            <Button onClick={handleAddNew} disabled={!newProduct.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  {editingId === product.id ? (
                    // 수정 모드
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-muted-foreground w-8 text-center">
                        {index + 1}
                      </span>
                      <Input
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, name: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                        className="flex-1"
                        autoFocus
                      />
                      <Input
                        value={editFormData.category}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, category: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                        placeholder="카테고리"
                        className="w-32"
                      />
                      <Input
                        value={editFormData.unit}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, unit: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                        className="w-20"
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        저장
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        취소
                      </Button>
                    </div>
                  ) : (
                    // 보기 모드
                    <>
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
                          disabled={editingId !== null}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          disabled={editingId !== null}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
