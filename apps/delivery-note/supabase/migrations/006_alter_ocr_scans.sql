-- ocr_scans 테이블에 supplier_id 컬럼 추가
ALTER TABLE ocr_scans
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_ocr_scans_supplier_id ON ocr_scans(supplier_id);
