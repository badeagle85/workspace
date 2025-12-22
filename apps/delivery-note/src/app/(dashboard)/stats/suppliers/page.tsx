"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSuppliers } from "@/lib/suppliers";
import { getOcrScans } from "@/lib/ocr";
import type { Supplier } from "@/types";

interface MonthlyData {
  [month: string]: number;
}

interface ItemTrend {
  name: string;
  standardProductName: string | null;
  unit: string;
  monthlyData: MonthlyData;
  total: number;
}

export default function SupplierStatsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [itemTrends, setItemTrends] = useState<ItemTrend[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [totalScans, setTotalScans] = useState(0);
  const [months, setMonths] = useState<string[]>([]);

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

    // 월별로 품목 집계
    const itemMap = new Map<string, ItemTrend>();
    const monthSet = new Set<string>();

    for (const scan of scans) {
      if (!scan.documentDate) continue;

      const month = scan.documentDate.substring(0, 7); // YYYY-MM
      monthSet.add(month);

      for (const item of scan.items) {
        const key = item.standardProductName || item.name;

        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: item.name,
            standardProductName: item.standardProductName || null,
            unit: item.unit || "",
            monthlyData: {},
            total: 0,
          });
        }

        const trend = itemMap.get(key)!;
        trend.monthlyData[month] = (trend.monthlyData[month] || 0) + (item.quantity || 0);
        trend.total += item.quantity || 0;
      }
    }

    // 월 정렬
    const sortedMonths = Array.from(monthSet).sort();
    setMonths(sortedMonths);

    // 정렬 (합계 0인 것은 맨 뒤로, 나머지는 가나다순)
    const sorted = Array.from(itemMap.values()).sort((a, b) => {
      if (a.total === 0 && b.total !== 0) return 1;
      if (a.total !== 0 && b.total === 0) return -1;
      const nameA = a.standardProductName || a.name;
      const nameB = b.standardProductName || b.name;
      return nameA.localeCompare(nameB, 'ko');
    });

    setItemTrends(sorted);
    // 기본적으로 합계가 0이 아닌 모든 품목 선택
    setSelectedItems(new Set(sorted.filter(item => item.total > 0).map(item => item.standardProductName || item.name)));
    setIsLoading(false);
  }

  // 품목 선택 토글
  function toggleItem(key: string) {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  }

  // 전체 선택/해제
  function toggleAll() {
    if (selectedItems.size === itemTrends.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itemTrends.map(item => item.standardProductName || item.name)));
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const filteredItems = itemTrends.filter(item => selectedItems.has(item.standardProductName || item.name));

  // 월 표시 형식
  function formatMonth(month: string) {
    return month.substring(5) + "월"; // "2025-10" -> "10월"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">공급업체별 현황</h1>
        <p className="text-muted-foreground mt-1">
          공급업체별 월별 품목 현황을 확인합니다.
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

      {/* 품목 선택 */}
      {itemTrends.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                품목 선택
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({selectedItems.size}/{itemTrends.length}개 선택)
                </span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedItems.size === itemTrends.length ? "전체 해제" : "전체 선택"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {itemTrends.map((item) => {
                const key = item.standardProductName || item.name;
                const isSelected = selectedItems.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleItem(key)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary"
                    } ${item.total === 0 ? "opacity-50" : ""}`}
                  >
                    {item.standardProductName || item.name}
                    {item.total > 0 && (
                      <span className="ml-1 text-xs opacity-70">({item.total})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월별 현황 테이블 */}
      {filteredItems.length > 0 && months.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedSupplier?.name} - {selectedYear}년 월별 현황
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (명세서 {totalScans}건)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">품목명</th>
                    {months.map((month) => (
                      <th key={month} className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                        {formatMonth(month)}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const key = item.standardProductName || item.name;
                    return (
                      <tr key={key} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          {item.standardProductName ? (
                            <>
                              <span className="font-medium">{item.standardProductName}</span>
                              <span className="ml-2 text-xs text-muted-foreground">({item.name})</span>
                            </>
                          ) : (
                            <span>{item.name}</span>
                          )}
                        </td>
                        {months.map((month) => (
                          <td key={month} className="text-right px-4 py-3 font-mono">
                            {item.monthlyData[month] ? item.monthlyData[month].toLocaleString() : "-"}
                          </td>
                        ))}
                        <td className="text-right px-4 py-3 font-mono font-medium">
                          {item.total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* 합계 행 */}
                <tfoot>
                  <tr className="bg-muted/30 font-medium">
                    <td className="px-4 py-3">합계</td>
                    {months.map((month) => {
                      const monthTotal = filteredItems.reduce((sum, item) => sum + (item.monthlyData[month] || 0), 0);
                      return (
                        <td key={month} className="text-right px-4 py-3 font-mono">
                          {monthTotal > 0 ? monthTotal.toLocaleString() : "-"}
                        </td>
                      );
                    })}
                    <td className="text-right px-4 py-3 font-mono">
                      {filteredItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결과 없음 */}
      {!isLoading && totalScans === 0 && selectedSupplierId && itemTrends.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          해당 기간에 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
