-- V032: Căn chỉnh phạm vi (scope) các gói dịch vụ chuẩn hóa lâm sàng và đồng bộ subscription của CLINIC (FR-11, FR-28)

-- 1. Cập nhật hoặc chèn 6 gói dịch vụ chuẩn hóa (Gói 1, 2, 3: INDIVIDUAL; Gói 101, 102, 103: CLINIC)
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
    scope = EXCLUDED.scope,
    price = EXCLUDED.price,
    credits = EXCLUDED.credits,
    validity_days = EXCLUDED.validity_days,
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP;

-- 2. UPDATE dự phòng đảm bảo Gói 3 luôn luôn mang scope INDIVIDUAL và các thuộc tính chuẩn
UPDATE service_package
SET scope = 'INDIVIDUAL',
    credits = 15,
    price = 500000.00,
    validity_days = 180,
    active = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 3 AND scope <> 'INDIVIDUAL';

-- 3. Căn chỉnh subscription của tài khoản CLINIC đang trỏ nhầm gói 3 chuyển sang gói 101
-- Bước 3.1: Nếu tài khoản CLINIC đã có sẵn gói 101, gộp credits và gia hạn ngày hết hạn từ gói 3 sang gói 101
WITH clinic_users AS (
    SELECT ur.user_id AS user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'CLINIC'
    UNION
    SELECT cp.user_id AS user_id FROM clinic_profiles cp
),
pkg3_clinic_subs AS (
    SELECT s.owner_id, s.remaining_credits, s.expires_at, s.status
    FROM subscription s
    JOIN clinic_users cu ON s.owner_id = cu.user_id
    WHERE s.service_package_id = 3
)
UPDATE subscription s101
SET remaining_credits = s101.remaining_credits + p3.remaining_credits,
    expires_at = GREATEST(s101.expires_at, p3.expires_at),
    status = CASE 
        WHEN s101.status = 'ACTIVE' OR p3.status = 'ACTIVE' THEN 'ACTIVE' 
        ELSE s101.status 
    END,
    updated_at = CURRENT_TIMESTAMP
FROM pkg3_clinic_subs p3
WHERE s101.service_package_id = 101
  AND s101.owner_id = p3.owner_id;

-- Bước 3.2: Xóa bản ghi subscription gói 3 của các tài khoản CLINIC đã được gộp vào gói 101 ở trên
DELETE FROM subscription
WHERE service_package_id = 3
  AND owner_id IN (
      SELECT s101.owner_id
      FROM subscription s101
      WHERE s101.service_package_id = 101
  )
  AND owner_id IN (
      SELECT ur.user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'CLINIC'
      UNION
      SELECT cp.user_id FROM clinic_profiles cp
  );

-- Bước 3.3: Chuyển đổi các subscription gói 3 còn lại của tài khoản CLINIC sang gói 101 (chưa từng có gói 101)
UPDATE subscription
SET service_package_id = 101,
    updated_at = CURRENT_TIMESTAMP
WHERE service_package_id = 3
  AND owner_id IN (
      SELECT ur.user_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE r.name = 'CLINIC'
      UNION
      SELECT cp.user_id FROM clinic_profiles cp
  );

-- 4. Đồng bộ Sequence PostgreSQL của bảng service_package
SELECT setval(pg_get_serial_sequence('service_package', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM service_package), 1), 103));
