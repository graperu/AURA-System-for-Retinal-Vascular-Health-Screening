-- V045: Rà soát và dọn dẹp triệt để dữ liệu hạt giống thử nghiệm (Test Seed Data Cleanup)
-- 1. Xóa sạch 7 tài khoản bệnh nhân mẫu (patient@aura.com, patient.hoa, patient.hung, patient.phuong, patient.tuan, patient.an, patient.binh)
-- 2. Xóa sạch 6 ca khám giả lập (a2000000-0000-0000-0000-000000000002 đến a2000000-0000-0000-0000-000000000007)
-- 3. Xóa các phân công bác sĩ giả lập và lịch hẹn của bệnh nhân mẫu
-- 4. Xóa toàn bộ giao dịch nạp thử nghiệm số tiền ảo mang mã LOCAL_TXN_* và giao dịch của bệnh nhân mẫu
-- 5. Chuẩn hóa subscription của phòng khám về mức 200 credit thực tế, loại bỏ 2000 và 10000 credit ảo
-- 6. Bảo lưu tuyệt đối tài khoản người dùng thật (dinhphan0511@gmail.com, dinhphan05111@gmail.com, trunghaomach992@gmail.com)
--    và các hồ sơ bác sĩ, phòng khám, admin chuẩn hệ thống.

-- ==============================================================================
-- BƯỚC 1: XÓA CÁC BẢN GHI CON LIÊN KẾT VỚI CA KHÁM GIẢ LẬP VÀ TIN NHẮN CHAT
-- ==============================================================================
-- 1.1. Duy trì số lượng bản ghi chat_messages bằng 0 (Zero chat messages)
DELETE FROM chat_messages;

-- 1.2. Xóa các phản hồi đánh giá bác sĩ (doctor_feedback) liên quan đến ca khám giả lập nếu có
DELETE FROM doctor_feedback 
WHERE screening_id IN (
    'a2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000005',
    'a2000000-0000-0000-0000-000000000006',
    'a2000000-0000-0000-0000-000000000007'
);

-- ==============================================================================
-- BƯỚC 2: XÓA SẠCH 6 CA KHÁM GIẢ LẬP (A2000000-...) VÀ ẢNH PLACEHOLDER
-- ==============================================================================
DELETE FROM screenings 
WHERE id IN (
    'a2000000-0000-0000-0000-000000000002',
    'a2000000-0000-0000-0000-000000000003',
    'a2000000-0000-0000-0000-000000000004',
    'a2000000-0000-0000-0000-000000000005',
    'a2000000-0000-0000-0000-000000000006',
    'a2000000-0000-0000-0000-000000000007'
)
OR image_url = '/assets/images/fundus_original.png'
OR patient_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- ==============================================================================
-- BƯỚC 3: XÓA CÁC THỰC THỂ CON CỦA 7 TÀI KHOẢN BỆNH NHÂN KIỂM THỬ
-- Tuân thủ nghiêm ngặt Foreign Key Constraints theo thứ tự con -> cha
-- ==============================================================================

-- 3.1. Xóa lịch hẹn khám của bệnh nhân kiểm thử (appointments)
DELETE FROM appointments 
WHERE patient_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.2. Xóa phân công bác sĩ giả lập (doctor_patient_assignments)
DELETE FROM doctor_patient_assignments 
WHERE patient_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.3. Xóa hồ sơ y tế bệnh nhân (patient_medical_profiles)
DELETE FROM patient_medical_profiles 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
)
OR mrn IN (
    'MRN-2026-0941',
    'MRN-2026-1102',
    'MRN-2026-1103',
    'MRN-2026-1104',
    'MRN-2026-1105',
    'MRN-2026-1106',
    'MRN-2026-1107'
);

-- 3.4. Xóa hồ sơ làm việc/danh sách bệnh nhân (patient_profiles)
DELETE FROM patient_profiles 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
)
OR mrn IN (
    'MRN-2026-0941',
    'MRN-2026-1102',
    'MRN-2026-1103',
    'MRN-2026-1104',
    'MRN-2026-1105',
    'MRN-2026-1106',
    'MRN-2026-1107'
);

-- 3.5. Xóa tài liệu xét nghiệm mẫu nếu có (patient_lab_documents)
DELETE FROM patient_lab_documents 
WHERE patient_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.6. Xóa thông báo của bệnh nhân mẫu (user_notifications)
DELETE FROM user_notifications 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.7. Xóa refresh_tokens của bệnh nhân mẫu (Foreign Key: ON DELETE NO ACTION)
DELETE FROM refresh_tokens 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.8. Xóa subscription của bệnh nhân mẫu
DELETE FROM subscription 
WHERE owner_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.9. Xóa user_roles của bệnh nhân mẫu (Foreign Key: ON DELETE NO ACTION)
DELETE FROM user_roles 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
);

-- 3.10. Ngắt liên kết user_id trong audit_logs cho bệnh nhân mẫu
UPDATE audit_logs 
SET user_id = NULL 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
)
OR user_email LIKE 'patient%@aura.com';

-- ==============================================================================
-- BƯỚC 4: CHUẨN HÓA GIAO DỊCH TÀI CHÍNH VÀ SUBSCRIPTIONS (R2)
-- ==============================================================================
-- 4.1. Xóa bỏ các giao dịch nạp thử nghiệm số tiền ảo (LOCAL_TXN_*) và giao dịch bệnh nhân mẫu
DELETE FROM payment_transaction 
WHERE buyer_id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
)
OR gateway_transaction_no LIKE 'LOCAL_TXN_%'
OR (amount IN (18000000.00, 40000000.00) AND buyer_id = '33333333-3333-3333-3333-333333333333');

-- 4.2. Loại bỏ các gói subscription nạp thử nghiệm ảo (2000, 10000 credit) của phòng khám
DELETE FROM subscription 
WHERE owner_id = '33333333-3333-3333-3333-333333333333' 
  AND service_package_id IN (102, 103);

-- 4.3. Đảm bảo subscription gói 101 của phòng khám có đúng 200 credit thực tế hợp lệ
UPDATE subscription 
SET remaining_credits = 200,
    status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP
WHERE owner_id = '33333333-3333-3333-3333-333333333333' 
  AND service_package_id = 101;

-- ==============================================================================
-- BƯỚC 5: XÓA SẠCH 7 TÀI KHOẢN BỆNH NHÂN KIỂM THỬ KHỎI BẢNG USERS (R1)
-- ==============================================================================
DELETE FROM users 
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111107'
)
OR email IN (
    'patient@aura.com',
    'patient.hoa@aura.com',
    'patient.hung@aura.com',
    'patient.phuong@aura.com',
    'patient.tuan@aura.com',
    'patient.an@aura.com',
    'patient.binh@aura.com'
);

-- ==============================================================================
-- BƯỚC 6: BẢO TỒN VÀ ĐỒNG BỘ DỮ LIỆU NGƯỜI DÙNG THẬT (R3)
-- Đồng bộ patient_profiles cho tài khoản thật dinhphan0511@gmail.com nếu chưa có
-- ==============================================================================
INSERT INTO patient_profiles (
    id, user_id, mrn, full_name, age, gender, phone, address,
    last_exam_date, risk_score, risk_level, review_status,
    findings_summary, avatar_color, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    pmp.user_id,
    pmp.mrn,
    u.full_name,
    pmp.age,
    pmp.gender,
    pmp.phone_number,
    pmp.address,
    COALESCE((SELECT created_at::date FROM screenings WHERE patient_id = u.id ORDER BY created_at DESC LIMIT 1), CURRENT_DATE),
    COALESCE((SELECT risk_score FROM screenings WHERE patient_id = u.id ORDER BY created_at DESC LIMIT 1), 0),
    COALESCE((SELECT risk_level FROM screenings WHERE patient_id = u.id ORDER BY created_at DESC LIMIT 1), 'LOW'),
    COALESCE((SELECT status FROM screenings WHERE patient_id = u.id ORDER BY created_at DESC LIMIT 1), 'PENDING_REVIEW'),
    'Bệnh nhân khám thực tế tại hệ thống',
    'from-blue-500 to-indigo-600',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM patient_medical_profiles pmp
JOIN users u ON pmp.user_id = u.id
WHERE u.email = 'dinhphan0511@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.user_id = u.id);
