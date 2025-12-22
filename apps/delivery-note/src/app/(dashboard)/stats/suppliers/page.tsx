"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSuppliers } from "@/lib/suppliers";
import { getOcrScans, type OcrScanRecord } from "@/lib/ocr";
import type { Supplier } from "@/types";

interface AggregatedItem {
  name: string;
  standardProductName: string | null;
  totalQuantity: number;
  unit: string;
  count: number; // 몇 건의 명세서에 포함되었는지
}

export default function SupplierStatsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalScans, setTotalScans] = useState(0);

  // 연도 목록 (최근 5년)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // 공급업체 목록 로드
  useEffect(() => {
    getSuppliers().then(setSuppliers);
  }, []);

  // 검색 실행
  async function handleSearch() {
    if (!selectedSupplierId) {
      alert("공급업체를 선택해주세요.");
      return;
    }

    setIsLoading(true);

    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    const scans = await getOcrScans({
      supplierId: selectedSupplierId,
      startDate,
      endDate,
      limit: 1000,
    });

    setTotalScans(scans.length);

    // 품목별 합산
    const itemMap = new Map<string, AggregatedItem>();

    for (const scan of scans) {
      for (const item of scan.items) {
        const key = item.standardProductName || item.name;

        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          existing.totalQuantity += item.quantity || 0;
          existing.count += 1;
        } else {
          itemMap.set(key, {
            name: item.name,
            standardProductName: item.standardProductName || null,
            totalQuantity: item.quantity || 0,
            unit: item.unit || "",
            count: 1,
          });
        }
      }
    }

    // 정렬 (합계 0인 것은 맨 뒤로, 나머지는 가나다순)
    const sorted = Array.from(itemMap.values()).sort((a, b) => {
      // 합계 0인 것은 맨 뒤로
      if (a.totalQuantity === 0 && b.totalQuantity !== 0) return 1;
      if (a.totalQuantity !== 0 && b.totalQuantity === 0) return -1;
      // 가나다순
      const nameA = a.standardProductName || a.name;
      const nameB = b.standardProductName || b.name;
      return nameA.localeCompare(nameB, 'ko');
    });
    setAggregatedItems(sorted);
    setIsLoading(false);
  }

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">공급업체별 현황</h1>
        <p className="text-muted-foreground mt-1">
          공급업체별 연간 품목 합산 현황을 확인합니다.
        </p>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">공급업체</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              >
                <option value="">선택하세요</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">연도</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 검색 버튼 */}
          <div className="flex items-center justify-end">
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "조회중..." : "조회"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결과 */}
      {aggregatedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedSupplier?.name} - {selectedYear}년 품목별 합산
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (명세서 {totalScans}건, 품목 {aggregatedItems.length}종)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-[1fr_100px_80px] gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                <div>품목명</div>
                <div className="text-right">합계</div>
                <div className="text-right">건수</div>
              </div>
              {/* 테이블 바디 */}
              <div>
                {aggregatedItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_100px_80px] gap-2 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <div>
                      {item.standardProductName ? (
                        <>
                          <span className="font-medium">{item.standardProductName}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({item.name})</span>
                        </>
                      ) : (
                        <span>{item.name}</span>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      {item.totalQuantity.toLocaleString()} {item.unit}
                    </div>
                    <div className="text-right text-muted-foreground">
                      {item.count}건
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결과 없음 */}
      {!isLoading && totalScans === 0 && selectedSupplierId && aggregatedItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          해당 기간에 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
