"use client";

import { useState } from "react";
import { Search, Filter, Download, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";

// 임시 데이터
const mockTransactions = [
  {
    id: "1",
    supplier: "ABC전기",
    transactionDate: "2024-12-01",
    documentNumber: "2024120001",
    itemCount: 15,
    totalAmount: 1500000,
    status: "confirmed",
  },
  {
    id: "2",
    supplier: "삼성전기자재",
    transactionDate: "2024-12-02",
    documentNumber: "2024120002",
    itemCount: 8,
    totalAmount: 850000,
    status: "pending",
  },
  {
    id: "3",
    supplier: "LS전선 대리점",
    transactionDate: "2024-12-03",
    documentNumber: "2024120003",
    itemCount: 22,
    totalAmount: 3200000,
    status: "confirmed",
  },
];

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "대기", className: "bg-yellow-100 text-yellow-800" },
  processing: { label: "처리중", className: "bg-blue-100 text-blue-800" },
  converted: { label: "변환완료", className: "bg-green-100 text-green-800" },
  confirmed: { label: "확정", className: "bg-primary/10 text-primary" },
  exported: { label: "내보내기완료", className: "bg-gray-100 text-gray-800" },
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">처리 이력</h1>
          <p className="text-muted-foreground mt-1">
            업로드하고 변환한 거래명세서 목록입니다.
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          내보내기
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="거래처명, 문서번호로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">거래 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">거래일자</th>
                  <th className="text-left py-3 px-4 font-medium">거래처</th>
                  <th className="text-left py-3 px-4 font-medium">문서번호</th>
                  <th className="text-center py-3 px-4 font-medium">품목수</th>
                  <th className="text-right py-3 px-4 font-medium">금액</th>
                  <th className="text-center py-3 px-4 font-medium">상태</th>
                  <th className="text-center py-3 px-4 font-medium">액션</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">{formatDate(tx.transactionDate)}</td>
                    <td className="py-3 px-4 font-medium">{tx.supplier}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {tx.documentNumber}
                    </td>
                    <td className="py-3 px-4 text-center">{tx.itemCount}</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(tx.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusLabels[tx.status]?.className
                        }`}
                      >
                        {statusLabels[tx.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
