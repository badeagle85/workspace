-- API 사용량 추적 테이블 (Delivery Note 프로젝트용)
CREATE TABLE IF NOT EXISTS delivery_note_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,           -- 'google_vision' 등
  year_month TEXT NOT NULL,         -- '2025-01' 형식
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- provider + year_month 조합은 유니크해야 함
  UNIQUE(provider, year_month)
);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_note_api_usage_updated_at
  BEFORE UPDATE ON delivery_note_api_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 (필요에 따라 조정)
ALTER TABLE delivery_note_api_usage ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능 (인증 없이 사용하는 경우)
CREATE POLICY "Allow all operations" ON delivery_note_api_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);
