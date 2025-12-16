// 템플릿 영역 정의
export interface TemplateRegion {
  id: string;
  name: string; // 영역 이름 (품명, 수량, 날짜 등)
  type: "product_name" | "quantity" | "date" | "supplier" | "unit_price" | "amount" | "custom";
  // 영역 좌표 (비율 기반, 0-100%)
  x: number; // 왼쪽 시작점 %
  y: number; // 위쪽 시작점 %
  width: number; // 너비 %
  height: number; // 높이 %
}

// 템플릿 정의
export interface Template {
  id: string;
  name: string; // 템플릿 이름 (예: "우성 워싱웨이")
  description?: string;
  // 템플릿 식별용 키워드 (자동 매칭에 사용)
  keywords: string[];
  // 영역 목록
  regions: TemplateRegion[];
  // 샘플 이미지 URL (미리보기용)
  sampleImageUrl?: string;
  // 메타데이터
  createdAt: string;
  updatedAt: string;
}

// 템플릿 생성 시 입력
export interface CreateTemplateInput {
  name: string;
  description?: string;
  keywords: string[];
  regions: Omit<TemplateRegion, "id">[];
  sampleImageUrl?: string;
}

// 영역 선택 상태
export interface RegionSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSelecting: boolean;
}

// 템플릿 매칭 결과
export interface TemplateMatchResult {
  template: Template;
  confidence: number; // 매칭 신뢰도 (0-100)
  matchedKeywords: string[];
}
