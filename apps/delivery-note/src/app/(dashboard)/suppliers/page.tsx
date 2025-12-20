"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/lib/suppliers";
import type { Supplier } from "@/types";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: "",
    memo: "",
  });

  // 데이터 로드
  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    setIsLoading(true);
    const data = await getSuppliers();
    setSuppliers(data);
    setIsLoading(false);
  }

  // 폼 초기화
  function resetForm() {
    setFormData({ name: "", memo: "" });
    setEditingId(null);
    setIsAdding(false);
  }

  // 추가 시작
  function handleAdd() {
    resetForm();
    setIsAdding(true);
  }

  // 수정 시작
  function handleEdit(e: React.MouseEvent, supplier: Supplier) {
    e.stopPropagation();
    setFormData({
      name: supplier.name,
      memo: supplier.memo || "",
    });
    setEditingId(supplier.id);
    setIsAdding(false);
  }

  // 저장
  async function handleSave() {
    if (!formData.name.trim()) {
      alert("공급업체명을 입력해주세요.");
      return;
    }

    try {
      if (editingId) {
        await updateSupplier(editingId, {
          name: formData.name.trim(),
          memo: formData.memo.trim() || undefined,
        });
      } else {
        await createSupplier({
          name: formData.name.trim(),
          memo: formData.memo.trim() || undefined,
        });
      }
      resetForm();
      loadSuppliers();
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  // 삭제
  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const success = await deleteSupplier(id);
    if (success) {
      loadSuppliers();
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  // 상세 페이지로 이동
  function handleRowClick(id: string) {
    if (editingId || isAdding) return;
    router.push(`/suppliers/${id}`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">공급업체 관리</h1>
            <p className="text-muted-foreground">
              거래명세서를 보내는 공급업체를 등록하고 품목 매핑을 설정합니다
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={isAdding || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          공급업체 추가
        </Button>
      </div>

      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingId ? "공급업체 수정" : "새 공급업체 추가"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="공급업체명 (예: A세탁소)"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="flex-1"
              />
              <Input
                placeholder="메모 (선택)"
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
                className="flex-1"
              />
              <Button onClick={handleSave}>저장</Button>
              <Button variant="outline" onClick={resetForm}>
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공급업체 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 공급업체 ({suppliers.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 공급업체가 없습니다. 공급업체를 추가해주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => handleRowClick(supplier.id)}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{supplier.name}</span>
                      {supplier.memo && (
                        <p className="text-sm text-muted-foreground">
                          {supplier.memo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(e, supplier)}
                      disabled={isAdding || editingId !== null}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, supplier.id)}
                      disabled={isAdding || editingId !== null}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
