-- 지점(매장) 테이블
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  memo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT stores_name_unique UNIQUE(name)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);

-- RLS 활성화
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (모든 사용자 접근 허용 - MVP)
CREATE POLICY "Allow all access to stores" ON stores
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_stores_updated_at();
