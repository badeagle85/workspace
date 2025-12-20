-- 표준 품목 테이블
CREATE TABLE IF NOT EXISTS standard_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'EA',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT standard_products_name_unique UNIQUE(name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_standard_products_name ON standard_products(name);
CREATE INDEX IF NOT EXISTS idx_standard_products_category ON standard_products(category);
CREATE INDEX IF NOT EXISTS idx_standard_products_is_active ON standard_products(is_active);
CREATE INDEX IF NOT EXISTS idx_standard_products_sort_order ON standard_products(sort_order);

-- RLS 활성화
ALTER TABLE standard_products ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (모든 사용자 접근 허용 - MVP)
CREATE POLICY "Allow all access to standard_products" ON standard_products
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_standard_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_standard_products_updated_at
  BEFORE UPDATE ON standard_products
  FOR EACH ROW
  EXECUTE FUNCTION update_standard_products_updated_at();
