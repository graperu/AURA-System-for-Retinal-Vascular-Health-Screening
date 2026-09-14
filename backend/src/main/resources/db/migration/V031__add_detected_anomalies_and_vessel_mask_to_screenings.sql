-- V031: Bổ sung trường detected_anomalies và vessel_mask_url vào bảng screenings để lưu trữ tọa độ tổn thương vi mạch và mặt nạ phân đoạn mạch máu từ AI
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS detected_anomalies TEXT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS vessel_mask_url TEXT;
