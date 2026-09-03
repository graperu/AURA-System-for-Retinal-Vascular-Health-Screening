-- V014: Bổ sung metadata lâm sàng và định dạng tệp cho bảng screenings (FR-2, FR-6)
ALTER TABLE screenings ALTER COLUMN image_url TYPE TEXT;

ALTER TABLE screenings ADD COLUMN IF NOT EXISTS eye_position VARCHAR(32);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS scan_type VARCHAR(64);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS risk_score INT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS av_ratio DOUBLE PRECISION;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS vessel_density VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_screenings_eye_position ON screenings(eye_position);
CREATE INDEX IF NOT EXISTS idx_screenings_scan_type ON screenings(scan_type);
