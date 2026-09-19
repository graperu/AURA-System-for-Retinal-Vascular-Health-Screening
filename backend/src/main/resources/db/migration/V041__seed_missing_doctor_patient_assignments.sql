-- V041: Seed missing doctor-patient assignments and patient profiles to ensure both Doctor and Patient portals display full data
-- Ensures BS. CKII Nguyễn Thị Thanh has assigned patients (Nam, Hoa, An)

INSERT INTO doctor_patient_assignments (id, doctor_id, patient_id, status, assigned_at, created_at, updated_at)
VALUES
(
    '55555555-5555-5555-5555-555555555551',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555552',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111102',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555553',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111106',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555554',
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111103',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111107',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555556',
    '22222222-2222-2222-2222-222222222224',
    '11111111-1111-1111-1111-111111111104',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '55555555-5555-5555-5555-555555555557',
    '22222222-2222-2222-2222-222222222225',
    '11111111-1111-1111-1111-111111111105',
    'ACTIVE', NOW(), NOW(), NOW()
)
ON CONFLICT (doctor_id, patient_id) DO UPDATE SET status = 'ACTIVE', updated_at = NOW();

-- Seed missing patient_profiles for Hoa and An to ensure full synchronization with patient_medical_profiles
INSERT INTO patient_profiles (
    id, user_id, mrn, full_name, age, gender, phone, address,
    systolic_bp, diastolic_bp, hba1c, has_diabetes, has_hypertension, history_of_smoking,
    last_exam_date, assigned_doctor, risk_score, risk_level, review_status, findings_summary,
    avatar_color, created_at, updated_at
) VALUES
(
    '11111111-1111-1111-1111-333333333302',
    '11111111-1111-1111-1111-111111111102',
    'MRN-2026-1102',
    'Bệnh nhân Trần Thị Mai Hoa',
    52, 'Nữ', '0934567891', 'Đống Đa, Hà Nội',
    135, 85, 6.8, TRUE, TRUE, FALSE,
    '2026-09-10', 'BS. CKII Nguyễn Thị Thanh', 52, 'MODERATE', 'REVIEWED',
    'Lòng mạch tiểu động mạch co thắt khu trú nhẹ, tỷ lệ A/V 0.58. Tiền sử ĐTĐ Type 2 kiểm soát khá.',
    'from-amber-500 to-orange-600', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-333333333306',
    '11111111-1111-1111-1111-111111111106',
    'MRN-2026-1106',
    'Bệnh nhân Hoàng Thúy An',
    67, 'Nữ', '0978912345', 'Ba Đình, Hà Nội',
    168, 102, 8.5, TRUE, TRUE, FALSE,
    '2026-09-11', 'BS. CKII Nguyễn Thị Thanh', 92, 'CRITICAL', 'REVIEWED',
    'Bệnh võng mạc tăng huyết áp độ IV kết hợp phù hoàng điểm, xuất tiết cứng hình sao hoàng điểm.',
    'from-rose-600 to-red-700', NOW(), NOW()
)
ON CONFLICT (mrn) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    assigned_doctor = EXCLUDED.assigned_doctor,
    review_status = EXCLUDED.review_status,
    updated_at = NOW();
