"use client";

import { useState, useEffect } from "react";
import { Plus, Store, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
} from "@/lib/stores";
import type { Store as StoreType } from "@/types";

export default function StoresPage() {
  const [stores, setStores] = useState<StoreType[]>([]);
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
    loadStores();
  }, []);

  async function loadStores() {
    setIsLoading(true);
    const data = await getStores();
    setStores(data);
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
  function handleEdit(e: React.MouseEvent, store: StoreType) {
    e.stopPropagation();
    setFormData({
      name: store.name,
      memo: store.memo || "",
    });
    setEditingId(store.id);
    setIsAdding(false);
  }

  // 저장
  async function handleSave() {
    if (!formData.name.trim()) {
      alert("지점명을 입력해주세요.");
      return;
    }

    try {
      if (editingId) {
        await updateStore(editingId, {
          name: formData.name.trim(),
          memo: formData.memo.trim() || undefined,
        });
      } else {
        await createStore({
          name: formData.name.trim(),
          memo: formData.memo.trim() || undefined,
        });
      }
      resetForm();
      loadStores();
    } catch (error) {
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    }
  }

  // 삭제
  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const success = await deleteStore(id);
    if (success) {
      loadStores();
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">지점 관리</h1>
            <p className="text-muted-foreground">
              거래명세서를 받는 지점(매장)을 등록합니다
            </p>
          </div>
        </div>
        <Button onClick={handleAdd} disabled={isAdding || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          지점 추가
        </Button>
      </div>

      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingId ? "지점 수정" : "새 지점 추가"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="지점명 (예: 본점)"
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

      {/* 지점 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 지점 ({stores.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 지점이 없습니다. 지점을 추가해주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Store className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{store.name}</span>
                      {store.memo && (
                        <p className="text-sm text-muted-foreground">
                          {store.memo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEdit(e, store)}
                      disabled={isAdding || editingId !== null}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, store.id)}
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
