-- 품목 매핑 테이블 (공급업체 + 원본품목명 → 표준품목)
CREATE TABLE IF NOT EXISTS product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  standard_product_id UUID NOT NULL REFERENCES standard_products(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 공급업체에서 같은 원본 품명은 하나의 표준 품목에만 매핑
  CONSTRAINT product_mappings_supplier_original_unique UNIQUE(supplier_id, original_name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_product_mappings_supplier_id ON product_mappings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_standard_product_id ON product_mappings(standard_product_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_original_name ON product_mappings(original_name);

-- RLS 활성화
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (모든 사용자 접근 허용 - MVP)
CREATE POLICY "Allow all access to product_mappings" ON product_mappings
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_product_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_mappings_updated_at
  BEFORE UPDATE ON product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_product_mappings_updated_at();
