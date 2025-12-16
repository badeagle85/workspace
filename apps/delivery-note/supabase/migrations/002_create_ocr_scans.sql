-- OCR 스캔 결과 저장 테이블
CREATE TABLE IF NOT EXISTS ocr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 스캔 정보
  provider TEXT NOT NULL DEFAULT 'google_vision',  -- 'google_vision' | 'tesseract'
  confidence DECIMAL(5, 2),                        -- OCR 신뢰도 (%)
  raw_text TEXT,                                   -- OCR 원본 텍스트

  -- 파싱된 거래명세서 정보
  document_date DATE,                              -- 거래 날짜
  supplier TEXT,                                   -- 공급자 상호
  document_number TEXT,                            -- 등록번호

  -- 품목 목록 (JSON 배열)
  items JSONB NOT NULL DEFAULT '[]',               -- [{name, quantity, unit}]

  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_ocr_scans_updated_at
  BEFORE UPDATE ON ocr_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책
ALTER TABLE ocr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ocr_scans" ON ocr_scans
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 인덱스
CREATE INDEX idx_ocr_scans_document_date ON ocr_scans(document_date);
CREATE INDEX idx_ocr_scans_created_at ON ocr_scans(created_at);
