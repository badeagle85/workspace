"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
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

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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

            {/* 초기화 버튼 */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className="w-full"
              >
                초기화
              </Button>
            </div>
          </div>
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
            <div className="border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[100px_1fr_1fr_80px_40px] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                <div>거래일자</div>
                <div>공급업체</div>
                <div>지점</div>
                <div className="text-center">품목수</div>
                <div></div>
              </div>
              {/* Table Body */}
              {scans.map((scan) => (
                <div key={scan.id} className="border-b last:border-b-0">
                  {/* Summary Row */}
                  <button
                    onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
                    className="w-full text-left grid grid-cols-[100px_1fr_1fr_80px_40px] gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center"
                  >
                    <div className="text-sm">
                      {scan.documentDate ? formatDate(scan.documentDate) : "-"}
                    </div>
                    <div className="font-medium truncate">
                      {scan.supplierName || <span className="text-muted-foreground">미지정</span>}
                    </div>
                    <div className="truncate text-muted-foreground">
                      {scan.storeName || <span>미지정</span>}
                    </div>
                    <div className="text-center text-sm">
                      <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                        {scan.items.length}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      {expandedId === scan.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Detail Panel */}
                  {expandedId === scan.id && (
                    <div className="border-t p-4 bg-muted/30 space-y-4">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">공급업체</div>
                          <div className="font-medium">{scan.supplierName || "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">지점</div>
                          <div className="font-medium">{scan.storeName || "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">문서 날짜</div>
                          <div className="font-medium">{scan.documentDate ? formatDate(scan.documentDate) : "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs mb-1">문서 번호</div>
                          <div className="font-medium">{scan.documentNumber || "-"}</div>
                        </div>
                      </div>

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
                                className="rounded-lg border max-h-80 object-contain bg-white"
                              />
                            </a>
                          </div>
                        )}

                        {/* 품목 목록 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">품목 목록</div>
                            <div className="text-xs text-muted-foreground">
                              총 {scan.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}개
                            </div>
                          </div>
                          <div className="space-y-1 max-h-80 overflow-y-auto">
                            {scan.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 rounded bg-background"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                                  {item.standardProductName ? (
                                    <>
                                      <span className="font-medium">{item.standardProductName}</span>
                                      <span className="text-xs text-muted-foreground">({item.name})</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{item.name}</span>
                                      <span className="text-xs text-orange-500">(미매핑)</span>
                                    </>
                                  )}
                                </div>
                                <span className="text-muted-foreground font-mono">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 메타 정보 */}
                      <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>등록일: {formatDate(scan.createdAt)}</span>
                          <span>OCR: {scan.provider === "google_vision" ? "Google Vision" : "Tesseract"}</span>
                          {scan.confidence > 0 && (
                            <span>신뢰도: {Math.round(scan.confidence)}%</span>
                          )}
                        </div>
                        <span className="font-mono text-[10px]">{scan.id.slice(0, 8)}</span>
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
