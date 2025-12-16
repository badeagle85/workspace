"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TemplateRegion } from "@/types/template";

interface RegionSelectorProps {
  imageUrl: string;
  regions: Omit<TemplateRegion, "id">[];
  onRegionsChange: (regions: Omit<TemplateRegion, "id">[]) => void;
  selectedRegionType: TemplateRegion["type"];
}

const REGION_COLORS: Record<TemplateRegion["type"], string> = {
  product_name: "border-blue-500 bg-blue-500/20",
  quantity: "border-green-500 bg-green-500/20",
  date: "border-purple-500 bg-purple-500/20",
  supplier: "border-orange-500 bg-orange-500/20",
  unit_price: "border-pink-500 bg-pink-500/20",
  amount: "border-red-500 bg-red-500/20",
  custom: "border-gray-500 bg-gray-500/20",
};

const REGION_LABELS: Record<TemplateRegion["type"], string> = {
  product_name: "품명",
  quantity: "수량",
  date: "날짜",
  supplier: "거래처",
  unit_price: "단가",
  amount: "금액",
  custom: "기타",
};

export function RegionSelector({
  imageUrl,
  regions,
  onRegionsChange,
  selectedRegionType,
}: RegionSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // 이미지 로드 시 크기 저장
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.clientWidth, height: img.clientHeight });
  };

  // 마우스 좌표를 % 단위로 변환
  const getPercentageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || imageSize.width === 0) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / imageSize.width) * 100;
      const y = ((clientY - rect.top) / imageSize.height) * 100;

      return {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    },
    [imageSize]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 좌클릭만
    const coords = getPercentageCoords(e.clientX, e.clientY);
    setStartPoint(coords);
    setCurrentPoint(coords);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const coords = getPercentageCoords(e.clientX, e.clientY);
    setCurrentPoint(coords);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // 최소 크기 체크 (2% 이상)
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    if (width < 2 || height < 2) return;

    const newRegion: Omit<TemplateRegion, "id"> = {
      name: REGION_LABELS[selectedRegionType],
      type: selectedRegionType,
      x: Math.min(startPoint.x, currentPoint.x),
      y: Math.min(startPoint.y, currentPoint.y),
      width,
      height,
    };

    onRegionsChange([...regions, newRegion]);
  };

  const handleDeleteRegion = (index: number) => {
    onRegionsChange(regions.filter((_, i) => i !== index));
  };

  // 현재 그리고 있는 영역
  const drawingRegion =
    isDrawing && Math.abs(currentPoint.x - startPoint.x) > 1
      ? {
          x: Math.min(startPoint.x, currentPoint.x),
          y: Math.min(startPoint.y, currentPoint.y),
          width: Math.abs(currentPoint.x - startPoint.x),
          height: Math.abs(currentPoint.y - startPoint.y),
        }
      : null;

  return (
    <div
      ref={containerRef}
      className="relative inline-block cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 이미지 */}
      <img
        src={imageUrl}
        alt="Template"
        className="max-w-full h-auto"
        onLoad={handleImageLoad}
        draggable={false}
      />

      {/* 저장된 영역들 */}
      {regions.map((region, index) => (
        <div
          key={index}
          className={cn(
            "absolute border-2 flex items-start justify-between p-1",
            REGION_COLORS[region.type]
          )}
          style={{
            left: `${region.x}%`,
            top: `${region.y}%`,
            width: `${region.width}%`,
            height: `${region.height}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-medium bg-white/80 px-1 rounded">
            {region.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 bg-white/80 hover:bg-red-100"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRegion(index);
            }}
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
        </div>
      ))}

      {/* 현재 그리고 있는 영역 */}
      {drawingRegion && (
        <div
          className={cn(
            "absolute border-2 border-dashed",
            REGION_COLORS[selectedRegionType]
          )}
          style={{
            left: `${drawingRegion.x}%`,
            top: `${drawingRegion.y}%`,
            width: `${drawingRegion.width}%`,
            height: `${drawingRegion.height}%`,
          }}
        />
      )}
    </div>
  );
}
