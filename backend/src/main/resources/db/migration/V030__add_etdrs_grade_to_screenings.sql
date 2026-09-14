-- V030: Bổ sung trường etdrs_grade vào bảng screenings để lưu trữ chính xác phân độ bệnh võng mạc đái tháo đường
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS etdrs_grade VARCHAR(100);
