-- ocr_scans 테이블에 store_id 컬럼 추가
ALTER TABLE ocr_scans ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ocr_scans_store_id ON ocr_scans(store_id);
