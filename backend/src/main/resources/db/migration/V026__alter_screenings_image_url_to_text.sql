-- V026: Đảm bảo cột image_url trong bảng screenings có kiểu dữ liệu TEXT (không giới hạn độ dài cho Data URI)
ALTER TABLE screenings ALTER COLUMN image_url TYPE TEXT;
