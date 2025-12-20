"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getOcrScans, type OcrScanRecord } from "@/lib/ocr";
import { getSuppliers } from "@/lib/suppliers";
import { getStores } from "@/lib/stores";
import type { Supplier, Store } from "@/types";

export default function HistoryPage() {
  const [scans, setScans] = useState<OcrScanRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 필터 상태
  const [filterSupplierId, setFilterSupplierId] = useState<string>("");
  const [filterStoreId, setFilterStoreId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // 상세 보기 상태
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([getSuppliers(), getStores()]).then(([suppliersData, storesData]) => {
      setSuppliers(suppliersData);
      setStores(storesData);
    });
  }, []);

  // 스캔 데이터 로드 (필터 변경 시)
  useEffect(() => {
    async function loadScans() {
      setIsLoading(true);
      const data = await getOcrScans({
        supplierId: filterSupplierId || undefined,
        storeId: filterStoreId || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      });
      setScans(data);
      setIsLoading(false);
    }
    loadScans();
  }, [filterSupplierId, filterStoreId, filterStartDate, filterEndDate]);

  // 필터 초기화
  function resetFilters() {
    setFilterSupplierId("");
    setFilterStoreId("");
    setFilterStartDate("");
    setFilterEndDate("");
  }

  const hasActiveFilters = filterSupplierId || filterStoreId || filterStartDate || filterEndDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">처리 이력</h1>
          <p className="text-muted-foreground mt-1">
            업로드한 거래명세서 목록입니다.
          </p>
        </div>
      </div>

      {/* Filter Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              필터
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {[filterSupplierId, filterStoreId, filterStartDate, filterEndDate].filter(Boolean).length}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                필터 초기화
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 공급업체 필터 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">공급업체</label>
                <select
                  value={filterSupplierId}
                  onChange={(e) => setFilterSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="">전체</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 지점 필터 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">지점</label>
                <select
                  value={filterStoreId}
                  onChange={(e) => setFilterStoreId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="">전체</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시작일 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">시작일</label>
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* 종료일 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">종료일</label>
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            명세서 목록
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({scans.length}건)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {hasActiveFilters
                ? "필터 조건에 맞는 데이터가 없습니다."
                : "저장된 명세서가 없습니다."}
            </div>
          ) : (
            <div className="space-y-2">
              {scans.map((scan) => (
                <div key={scan.id} className="border rounded-lg">
                  {/* Summary Row */}
                  <button
                    onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
                    className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium">
                            {scan.supplierName || "공급업체 미지정"}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-muted-foreground">
                            {scan.storeName || "지점 미지정"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{scan.documentDate ? formatDate(scan.documentDate) : "날짜 없음"}</span>
                          <span>품목 {scan.items.length}개</span>
                        </div>
                      </div>
                      {expandedId === scan.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Detail Panel */}
                  {expandedId === scan.id && (
                    <div className="border-t p-4 bg-muted/30">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 이미지 */}
                        {scan.imageUrl && (
                          <div>
                            <div className="text-sm font-medium mb-2">명세서 이미지</div>
                            <a
                              href={scan.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={scan.imageUrl}
                                alt="명세서"
                                className="rounded-lg border max-h-64 object-contain bg-white"
                              />
                            </a>
                          </div>
                        )}

                        {/* 품목 목록 */}
                        <div>
                          <div className="text-sm font-medium mb-2">품목 목록</div>
                          <div className="space-y-1">
                            {scan.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 rounded bg-background"
                              >
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                        등록일: {formatDate(scan.createdAt)}
                      </div>
                    </div>
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
