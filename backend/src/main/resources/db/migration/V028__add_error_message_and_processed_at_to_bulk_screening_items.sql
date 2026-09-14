-- V028: Bổ sung các trường error_message và processed_at cho bulk_screening_items để đồng bộ kết quả AI
ALTER TABLE bulk_screening_items ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE bulk_screening_items ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
