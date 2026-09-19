-- V040: Bổ sung cột image_payload vào bulk_screening_items để phục hồi hàng đợi sau khi restart
ALTER TABLE bulk_screening_items ADD COLUMN IF NOT EXISTS image_payload TEXT;
