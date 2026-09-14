-- V029: Cập nhật danh mục gói dịch vụ chuẩn hóa lâm sàng cho Cá nhân và Phòng khám (FR-11, FR-28)
INSERT INTO service_package (id, name, description, scope, price, credits, validity_days, active)
VALUES
    (1, 'Gói Cơ Bản (Khám Đơn)', '1 lượt phân tích ảnh võng mạc AI & bản đồ nhiệt Grad-CAM', 'INDIVIDUAL', 50000.00, 1, 30, TRUE),
    (2, 'Gói Tiêu Chuẩn (Cá Nhân)', '5 lượt phân tích theo dõi diễn tiến vi mạch định kỳ', 'INDIVIDUAL', 200000.00, 5, 90, TRUE),
    (3, 'Gói Gia Đình (Định Kỳ)', '15 lượt phân tích cho cả gia đình & lưu trữ trọn đời', 'INDIVIDUAL', 500000.00, 15, 180, TRUE),
    (101, 'Gói Cơ Sở Sàng Lọc (Clinic Starter)', '500 lượt phân tích ảnh vi mạch võng mạc AI cho phòng khám', 'CLINIC', 5000000.00, 500, 90, TRUE),
    (102, 'Gói Chiến Dịch Lâm Sàng (Clinic Campaign)', '2.000 lượt phân tích ảnh võng mạc tốc độ cao xử lý theo đợt', 'CLINIC', 18000000.00, 2000, 180, TRUE),
    (103, 'Gói Quy Mô Lớn / Bệnh Viện (Hospital Enterprise)', '5.000 lượt phân tích ảnh võng mạc ưu tiên cho bệnh viện', 'CLINIC', 40000000.00, 5000, 365, TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    credits = EXCLUDED.credits,
    validity_days = EXCLUDED.validity_days,
    active = TRUE;

-- Cập nhật sequence của service_package_id để tránh xung đột khi tạo mới
SELECT setval(pg_get_serial_sequence('service_package', 'id'), COALESCE((SELECT MAX(id) FROM service_package), 1));
