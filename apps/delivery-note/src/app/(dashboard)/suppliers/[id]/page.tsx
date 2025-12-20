"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Building2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupplierById } from "@/lib/suppliers";
import { getStandardProducts } from "@/lib/products";
import {
  getMappingsBySupplier,
  createMapping,
  deleteMapping,
} from "@/lib/mappings";
import type { Supplier, StandardProduct, ProductMapping } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SupplierDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [products, setProducts] = useState<StandardProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // 새 매핑 폼 상태
  const [newMapping, setNewMapping] = useState({
    originalName: "",
    standardProductId: "",
  });

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setIsLoading(true);

    const [supplierData, mappingsData, productsData] = await Promise.all([
      getSupplierById(id),
      getMappingsBySupplier(id),
      getStandardProducts(),
    ]);

    setSupplier(supplierData);
    setMappings(mappingsData);
    setProducts(productsData);
    setIsLoading(false);
  }

  // 매핑 추가
  async function handleAddMapping() {
    if (!newMapping.originalName.trim()) {
      alert("원본 품목명을 입력해주세요.");
      return;
    }
    if (!newMapping.standardProductId) {
      alert("표준 품목을 선택해주세요.");
      return;
    }

    try {
      await createMapping(
        id,
        newMapping.originalName.trim(),
        newMapping.standardProductId
      );
      setNewMapping({ originalName: "", standardProductId: "" });
      setIsAdding(false);
      loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "매핑 추가에 실패했습니다.");
    }
  }

  // 매핑 삭제
  async function handleDeleteMapping(mappingId: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const success = await deleteMapping(mappingId);
    if (success) {
      loadData();
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-8 text-muted-foreground">
          공급업체를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          {supplier.memo && (
            <p className="text-muted-foreground">{supplier.memo}</p>
          )}
        </div>
      </div>

      {/* 품목 매핑 설정 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            <CardTitle>품목 매핑 ({mappings.length}개)</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" />
            매핑 추가
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            이 공급업체의 거래명세서에 나오는 품목명을 표준 품목에 연결합니다.
          </p>

          {/* 새 매핑 추가 폼 */}
          {isAdding && (
            <div className="flex gap-4 mb-4 p-4 border rounded-lg bg-muted/30">
              <Input
                placeholder="원본 품목명 (예: 타월)"
                value={newMapping.originalName}
                onChange={(e) =>
                  setNewMapping({ ...newMapping, originalName: e.target.value })
                }
                className="flex-1"
              />
              <select
                value={newMapping.standardProductId}
                onChange={(e) =>
                  setNewMapping({
                    ...newMapping,
                    standardProductId: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-md bg-background"
              >
                <option value="">표준 품목 선택</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.category && ` [${product.category}]`}
                  </option>
                ))}
              </select>
              <Button onClick={handleAddMapping}>저장</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewMapping({ originalName: "", standardProductId: "" });
                }}
              >
                취소
              </Button>
            </div>
          )}

          {/* 매핑 목록 */}
          {mappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 매핑이 없습니다. 매핑을 추가해주세요.
            </div>
          ) : (
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-orange-600">
                      {mapping.originalName}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-primary">
                      {mapping.standardProduct?.name || "알 수 없음"}
                    </span>
                    {mapping.standardProduct?.category && (
                      <span className="text-sm text-muted-foreground">
                        [{mapping.standardProduct.category}]
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMapping(mapping.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 표준 품목이 없을 때 안내 */}
          {products.length === 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-yellow-50 text-yellow-800">
              <p className="text-sm">
                먼저 표준 품목을 등록해주세요.{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-yellow-800 underline"
                  onClick={() => router.push("/products")}
                >
                  표준 품목 관리로 이동
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
