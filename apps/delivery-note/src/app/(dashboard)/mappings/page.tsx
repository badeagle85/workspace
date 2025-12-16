"use client";

import { useState } from "react";
import { Search, Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 임시 데이터
const mockMappings = [
  {
    id: "1",
    originalName: "CBR 100AF 2P (SEC-102 60A)",
    manufacturer: "SEC",
    standardProduct: "누전차단기 2P100AF[小] 60A",
    category: "차단기",
    matchCount: 45,
    confidence: 100,
  },
  {
    id: "2",
    originalName: "ELB 2P 100AF 60A",
    manufacturer: "LS",
    standardProduct: "누전차단기 2P100AF[小] 60A",
    category: "차단기",
    matchCount: 32,
    confidence: 100,
  },
  {
    id: "3",
    originalName: "ELCB 100AF/60A 2P",
    manufacturer: "현대",
    standardProduct: "누전차단기 2P100AF[小] 60A",
    category: "차단기",
    matchCount: 18,
    confidence: 95,
  },
  {
    id: "4",
    originalName: "MCCB 3P 75A/100AF",
    manufacturer: "LS",
    standardProduct: "배선용차단기 3P100AF 75A",
    category: "차단기",
    matchCount: 28,
    confidence: 100,
  },
];

export default function MappingsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMappings = mockMappings.filter(
    (m) =>
      m.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.standardProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">품명 매핑 관리</h1>
          <p className="text-muted-foreground mt-1">
            제조사별 품명과 표준 ERP 품명 간의 매핑 규칙을 관리합니다.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          새 매핑 추가
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="원본 품명, 표준 품명, 제조사로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">152</p>
            <p className="text-sm text-muted-foreground">전체 매핑</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">48</p>
            <p className="text-sm text-muted-foreground">표준 품명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">제조사</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">94.5%</p>
            <p className="text-sm text-muted-foreground">평균 신뢰도</p>
          </CardContent>
        </Card>
      </div>

      {/* Mapping List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            매핑 목록 ({filteredMappings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMappings.map((mapping) => (
              <div
                key={mapping.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-muted/50 rounded-lg"
              >
                {/* Original Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-secondary rounded font-medium">
                      {mapping.manufacturer}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {mapping.category}
                    </span>
                  </div>
                  <p className="font-mono text-sm truncate">{mapping.originalName}</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:block flex-shrink-0" />

                {/* Standard Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-primary font-medium truncate">
                    {mapping.standardProduct}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>매칭 {mapping.matchCount}회</span>
                    <span>신뢰도 {mapping.confidence}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
