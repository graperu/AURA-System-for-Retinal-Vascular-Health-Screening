-- V034: Seed thêm bác sĩ chuyên khoa và bệnh nhân kèm hồ sơ lâm sàng, phân công và ca khám sàng lọc thực tế
-- Mật khẩu mặc định cho tất cả tài khoản: Password123@Aura

-- ==============================================================================
-- 1. SEED THÊM 3 BÁC SĨ CHUYÊN KHOA VÀO BẢNG USERS
-- ==============================================================================
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES 
    (
        '22222222-2222-2222-2222-222222222223',
        'doctor.minh@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'TS. BS. Trần Quang Minh',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222224',
        'doctor.lan@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'ThS. BS. Lê Hoàng Lan',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222225',
        'doctor.duc@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'BS. CKI Vũ Anh Đức',
        TRUE, TRUE, NOW(), NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    email_verified = TRUE;

-- Gán quyền DOCTOR cho 3 bác sĩ mới
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES
    (
        '22222222-2222-2222-2222-000000000003',
        '22222222-2222-2222-2222-222222222223',
        '00000000-0000-0000-0000-000000000002',
        NOW()
    ),
    (
        '22222222-2222-2222-2222-000000000004',
        '22222222-2222-2222-2222-222222222224',
        '00000000-0000-0000-0000-000000000002',
        NOW()
    ),
    (
        '22222222-2222-2222-2222-000000000005',
        '22222222-2222-2222-2222-222222222225',
        '00000000-0000-0000-0000-000000000002',
        NOW()
    )
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Khởi tạo hồ sơ bác sĩ chuyên khoa trong doctor_profiles
INSERT INTO doctor_profiles (
    id, user_id, specialty, hospital, title, license_number, years_of_experience, bio, created_at, updated_at
) VALUES
(
    '22222222-2222-2222-2222-222222222233',
    '22222222-2222-2222-2222-222222222223',
    'Dịch kính Võng mạc & Chẩn đoán hình ảnh Đáy mắt',
    'Bệnh viện Mắt TP.HCM / Cố vấn Chuyên môn AURA',
    'TS. BS.',
    'CCHN-005678/BYT',
    15,
    'Tiến sĩ Nhãn khoa chuyên sâu về chẩn đoán can thiệp bệnh dịch kính võng mạc và ứng dụng AI phân tích vi mạch đáy mắt.',
    NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222234',
    '22222222-2222-2222-2222-222222222224',
    'Nhãn khoa Tổng quát & Bệnh lý Glaucoma',
    'Bệnh viện Đại học Y Dược / Bác sĩ Chuyên khoa AURA',
    'ThS. BS.',
    'CCHN-008912/BYT',
    11,
    'Thạc sĩ Nhãn khoa giàu kinh nghiệm trong tầm soát sớm bệnh glôcôm, tổn thương lớp sợi thần kinh thị giác RNFL và theo dõi thị trường.',
    NOW(), NOW()
),
(
    '22222222-2222-2222-2222-222222222235',
    '22222222-2222-2222-2222-222222222225',
    'Bệnh võng mạc Tim mạch & Đái tháo đường',
    'Viện Tim mạch Quốc gia / Cố vấn Lâm sàng AURA',
    'BS. CKI',
    'CCHN-003456/BYT',
    14,
    'Bác sĩ chuyên khoa I chuyên về mối liên hệ giữa bệnh lý tim mạch - chuyển hóa và các biến chứng tổn thương vi mạch võng mạc.',
    NOW(), NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    hospital = EXCLUDED.hospital,
    title = EXCLUDED.title,
    license_number = EXCLUDED.license_number,
    years_of_experience = EXCLUDED.years_of_experience,
    bio = EXCLUDED.bio;

-- Liên kết 3 bác sĩ mới vào Phòng khám Đa khoa AURA trong clinic_members
INSERT INTO clinic_members (id, clinic_id, doctor_id, status, invited_at, created_at, updated_at)
VALUES
(
    '33333333-3333-3333-3333-333333333343',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222223',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '33333333-3333-3333-3333-333333333344',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222224',
    'ACTIVE', NOW(), NOW(), NOW()
),
(
    '33333333-3333-3333-3333-333333333345',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222225',
    'ACTIVE', NOW(), NOW(), NOW()
)
ON CONFLICT (clinic_id, doctor_id) DO UPDATE SET status = 'ACTIVE';

-- ==============================================================================
-- 2. SEED THÊM 6 BỆNH NHÂN ĐA DẠNG LÂM SÀNG VÀO BẢNG USERS
-- ==============================================================================
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES
    (
        '11111111-1111-1111-1111-111111111102',
        'patient.hoa@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'Bệnh nhân Trần Thị Mai Hoa',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '11111111-1111-1111-1111-111111111103',
        'patient.hung@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'Bệnh nhân Lê Văn Hùng',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '11111111-1111-1111-1111-111111111104',
        'patient.phuong@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'Bệnh nhân Phạm Bích Phương',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '11111111-1111-1111-1111-111111111105',
        'patient.tuan@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'Bệnh nhân Đỗ Minh Tuấn',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '11111111-1111-1111-1111-111111111106',
        'patient.an@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'Bệnh nhân Hoàng Thúy An',
        TRUE, TRUE, NOW(), NOW()
    ),
    (
        '11111111-1111-1111-1111-111111111107',
        'patient.binh@aura.com',
        '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu',
        'Bệnh nhân Vũ Đức Bình',
        TRUE, TRUE, NOW(), NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    email_verified = TRUE;

-- Gán quyền USER cho 6 bệnh nhân mới
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES
    ('11111111-1111-1111-1111-000000000002', '11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', NOW()),
    ('11111111-1111-1111-1111-000000000003', '11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001', NOW()),
    ('11111111-1111-1111-1111-000000000004', '11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000001', NOW()),
    ('11111111-1111-1111-1111-000000000005', '11111111-1111-1111-1111-111111111105', '00000000-0000-0000-0000-000000000001', NOW()),
    ('11111111-1111-1111-1111-000000000006', '11111111-1111-1111-1111-111111111106', '00000000-0000-0000-0000-000000000001', NOW()),
    ('11111111-1111-1111-1111-000000000007', '11111111-1111-1111-1111-111111111107', '00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ==============================================================================
-- 3. HỒ SƠ Y TẾ CHI TIẾT (PATIENT_MEDICAL_PROFILES) CHO 6 BỆNH NHÂN
-- ==============================================================================
INSERT INTO patient_medical_profiles (
    id, user_id, mrn, date_of_birth, age, gender, phone_number, address, blood_type,
    systolic_bp, diastolic_bp, hba1c, has_diabetes, diabetes_type, diabetes_duration_years,
    has_hypertension, history_of_smoking, history_of_heart_disease, history_of_stroke,
    current_medications, allergies, emergency_contact_name, emergency_contact_phone,
    assigned_doctor, created_at, updated_at
) VALUES
(
    '11111111-1111-1111-1111-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'MRN-2026-1102',
    '1972-08-20', 54, 'Nữ', '0934567891', 'Đống Đa, Hà Nội', 'A+',
    138, 86, 6.4, TRUE, 'Type 2', 3,
    TRUE, FALSE, FALSE, FALSE,
    'Metformin 850mg, Losartan 50mg', 'Không', 'Trần Văn Long', '0912349901',
    'BS. CKII Nguyễn Thị Thanh', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-222222222203',
    '11111111-1111-1111-1111-111111111103',
    'MRN-2026-1103',
    '1964-03-12', 62, 'Nam', '0945678912', 'Quận 3, TP. Hồ Chí Minh', 'O+',
    155, 95, 6.1, FALSE, 'None', 0,
    TRUE, TRUE, TRUE, FALSE,
    'Amlodipine 10mg, Atorvastatin 20mg, Aspirin 81mg', 'Dị ứng Penicillin', 'Lê Thị Thu', '0923459902',
    'TS. BS. Trần Quang Minh', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-222222222204',
    '11111111-1111-1111-1111-111111111104',
    'MRN-2026-1104',
    '1987-11-05', 39, 'Nữ', '0956789123', 'Cầu Giấy, Hà Nội', 'B+',
    118, 76, 5.3, FALSE, 'None', 0,
    FALSE, FALSE, FALSE, FALSE,
    'Không dùng thuốc thường xuyên', 'Không', 'Phạm Quốc Hưng', '0934569903',
    'ThS. BS. Lê Hoàng Lan', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-222222222205',
    '11111111-1111-1111-1111-111111111105',
    'MRN-2026-1105',
    '1968-06-18', 58, 'Nam', '0967891234', 'Hải Châu, Đà Nẵng', 'AB+',
    142, 90, 7.9, TRUE, 'Type 2', 8,
    TRUE, FALSE, FALSE, FALSE,
    'Gliclazide 60mg, Metformin 1000mg, Enalapril 10mg', 'Không', 'Đỗ Thúy Vy', '0945679904',
    'BS. CKI Vũ Anh Đức', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-222222222206',
    '11111111-1111-1111-1111-111111111106',
    'MRN-2026-1106',
    '1959-01-25', 67, 'Nữ', '0978912345', 'Ba Đình, Hà Nội', 'O-',
    168, 102, 8.5, TRUE, 'Type 2', 12,
    TRUE, FALSE, TRUE, TRUE,
    'Insulin Glargine, Telmisartan 80mg, Clopidogrel 75mg', 'Dị ứng Sulfamid', 'Hoàng Minh Quân', '0956789905',
    'BS. CKII Nguyễn Thị Thanh', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-222222222207',
    '11111111-1111-1111-1111-111111111107',
    'MRN-2026-1107',
    '1981-09-14', 45, 'Nam', '0989123456', 'Quận 1, TP. Hồ Chí Minh', 'O+',
    122, 80, 5.5, FALSE, 'None', 0,
    FALSE, FALSE, FALSE, FALSE,
    'Vitamin tổng hợp', 'Không', 'Vũ Khánh Chi', '0967899906',
    'TS. BS. Trần Quang Minh', NOW(), NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    mrn = EXCLUDED.mrn,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    phone_number = EXCLUDED.phone_number,
    address = EXCLUDED.address,
    blood_type = EXCLUDED.blood_type,
    systolic_bp = EXCLUDED.systolic_bp,
    diastolic_bp = EXCLUDED.diastolic_bp,
    hba1c = EXCLUDED.hba1c,
    has_diabetes = EXCLUDED.has_diabetes,
    has_hypertension = EXCLUDED.has_hypertension,
    assigned_doctor = EXCLUDED.assigned_doctor;

-- ==============================================================================
-- 4. HỒ SƠ PHỤC VỤ WORKLIST & DANH SÁCH BỆNH NHÂN (PATIENT_PROFILES)
-- ==============================================================================
INSERT INTO patient_profiles (
    id, user_id, mrn, full_name, age, gender, phone, address,
    systolic_bp, diastolic_bp, hba1c, has_diabetes, has_hypertension, history_of_smoking,
    last_exam_date, assigned_doctor, risk_score, risk_level, review_status,
    findings_summary, avatar_color, created_at, updated_at
) VALUES
(
    '11111111-1111-1111-1111-333333333302',
    '11111111-1111-1111-1111-111111111102',
    'MRN-2026-1102',
    'Bệnh nhân Trần Thị Mai Hoa',
    54, 'Nữ', '0934567891', 'Đống Đa, Hà Nội',
    138, 86, 6.4, TRUE, TRUE, FALSE,
    '2026-09-10', 'BS. CKII Nguyễn Thị Thanh', 52, 'MODERATE', 'REVIEWED',
    'Bắt chéo động-tĩnh mạch nhẹ, lòng mạch tiểu động mạch co thắt khu trú, vi mạch võng mạc uốn nhẹ.',
    'from-amber-500 to-yellow-600', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-333333333303',
    '11111111-1111-1111-1111-111111111103',
    'MRN-2026-1103',
    'Bệnh nhân Lê Văn Hùng',
    62, 'Nam', '0945678912', 'Quận 3, TP. Hồ Chí Minh',
    155, 95, 6.1, FALSE, TRUE, TRUE,
    '2026-09-08', 'TS. BS. Trần Quang Minh', 78, 'HIGH', 'REVIEWED',
    'Dấu hiệu Gunn sign rõ rệt, tỷ lệ A/V giảm còn 0.51, phản xạ ánh dây đồng, nguy cơ biến cố tim mạch cao.',
    'from-orange-500 to-red-600', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-333333333304',
    '11111111-1111-1111-1111-111111111104',
    'MRN-2026-1104',
    'Bệnh nhân Phạm Bích Phương',
    39, 'Nữ', '0956789123', 'Cầu Giấy, Hà Nội',
    118, 76, 5.3, FALSE, FALSE, FALSE,
    '2026-09-12', 'ThS. BS. Lê Hoàng Lan', 18, 'LOW', 'REVIEWED',
    'Mạng lưới vi mạch võng mạc phân nhánh đều, tỷ lệ A/V 0.68 bình thường, không tổn thương đáy mắt.',
    'from-emerald-500 to-teal-600', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-333333333305',
    '11111111-1111-1111-1111-111111111105',
    'MRN-2026-1105',
    'Bệnh nhân Đỗ Minh Tuấn',
    58, 'Nam', '0967891234', 'Hải Châu, Đà Nẵng',
    142, 90, 7.9, TRUE, TRUE, FALSE,
    '2026-09-14', 'BS. CKI Vũ Anh Đức', 82, 'HIGH', 'PENDING_REVIEW',
    'Bệnh võng mạc đái tháo đường tiền tăng sinh: vi phình mạch rải rác cực sau, xuất huyết chấm võng mạc.',
    'from-red-500 to-rose-600', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-333333333306',
    '11111111-1111-1111-1111-111111111106',
    'MRN-2026-1106',
    'Bệnh nhân Hoàng Thúy An',
    67, 'Nữ', '0978912345', 'Ba Đình, Hà Nội',
    168, 102, 8.5, TRUE, TRUE, FALSE,
    '2026-09-11', 'BS. CKII Nguyễn Thị Thanh', 92, 'CRITICAL', 'REVIEWED',
    'Bệnh võng mạc tăng huyết áp độ IV kết hợp phù hoàng điểm, xuất tiết cứng hình sao hoàng điểm, co hẹp động mạch nặng.',
    'from-rose-600 to-red-700', NOW(), NOW()
),
(
    '11111111-1111-1111-1111-333333333307',
    '11111111-1111-1111-1111-111111111107',
    'MRN-2026-1107',
    'Bệnh nhân Vũ Đức Bình',
    45, 'Nam', '0989123456', 'Quận 1, TP. Hồ Chí Minh',
    122, 80, 5.5, FALSE, FALSE, FALSE,
    '2026-09-13', 'TS. BS. Trần Quang Minh', 22, 'LOW', 'PENDING_REVIEW',
    'Sàng lọc định kỳ kiểm tra sức khỏe: vi mạch võng mạc sáng rõ, không ghi nhận dấu hiệu co thắt hay xơ vữa.',
    'from-blue-500 to-cyan-600', NOW(), NOW()
)
ON CONFLICT (mrn) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    systolic_bp = EXCLUDED.systolic_bp,
    diastolic_bp = EXCLUDED.diastolic_bp,
    hba1c = EXCLUDED.hba1c,
    has_diabetes = EXCLUDED.has_diabetes,
    has_hypertension = EXCLUDED.has_hypertension,
    last_exam_date = EXCLUDED.last_exam_date,
    assigned_doctor = EXCLUDED.assigned_doctor,
    risk_score = EXCLUDED.risk_score,
    risk_level = EXCLUDED.risk_level,
    review_status = EXCLUDED.review_status,
    findings_summary = EXCLUDED.findings_summary,
    avatar_color = EXCLUDED.avatar_color;

-- ==============================================================================
-- 5. PHÂN CÔNG BÁC SĨ - BỆNH NHÂN (DOCTOR_PATIENT_ASSIGNMENTS)
-- ==============================================================================
INSERT INTO doctor_patient_assignments (id, doctor_id, patient_id, status, assigned_at, created_at, updated_at)
VALUES
-- BS. Thanh phụ trách Nam, Hoa, An
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
-- TS. BS. Minh phụ trách Hùng, Bình
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
-- ThS. BS. Lan phụ trách Phương
(
    '55555555-5555-5555-5555-555555555556',
    '22222222-2222-2222-2222-222222222224',
    '11111111-1111-1111-1111-111111111104',
    'ACTIVE', NOW(), NOW(), NOW()
),
-- BS. CKI Đức phụ trách Tuấn
(
    '55555555-5555-5555-5555-555555555557',
    '22222222-2222-2222-2222-222222222225',
    '11111111-1111-1111-1111-111111111105',
    'ACTIVE', NOW(), NOW(), NOW()
)
ON CONFLICT (doctor_id, patient_id) DO UPDATE SET status = 'ACTIVE';

-- ==============================================================================
-- 6. SEED CÁC CA KHÁM SÀNG LỌC THỰC TẾ (SCREENINGS) CHO CÁC BỆNH NHÂN MỚI
-- ==============================================================================
INSERT INTO screenings (
    id, patient_id, doctor_id, clinic_id, image_url, status, risk_level, ai_risk_level, doctor_risk_level, confidence,
    findings, doctor_notes, eye_position, scan_type, file_name, file_size, mime_type,
    risk_score, av_ratio, vessel_density, cardiovascular_risk_score, diabetic_retinopathy_risk_score,
    stroke_risk_score, tortuosity_index, vertical_cdr, created_at, updated_at
) VALUES
-- Ca của Trần Thị Mai Hoa (MODERATE)
(
    'a2000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'MODERATE', 'MODERATE', 'MODERATE', 0.82,
    'Lòng mạch tiểu động mạch co thắt khu trú nhẹ, tỷ lệ A/V 0.58. Chưa thấy dấu hiệu xuất huyết hay xuất tiết.',
    'Bệnh nhân có tiền sử ĐTĐ Type 2 kiểm soát khá. Tiếp tục duy trì chế độ dinh dưỡng và tái khám sau 6 tháng.',
    'Both_OD_OS', 'Fundus_Macula', 'fundus_scan_hoa_20260910.png', 3150000, 'image/png',
    52, 0.58, '16.2%', 55, 48, 14, 1.31, 0.35,
    '2026-09-10 14:30:00+07', '2026-09-10 15:00:00+07'
),
-- Ca của Lê Văn Hùng (HIGH)
(
    'a2000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111103',
    '22222222-2222-2222-2222-222222222223',
    '33333333-3333-3333-3333-333333333333',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'HIGH', 'HIGH', 'HIGH', 0.89,
    'Hiện tượng Gunn sign rõ ở nhánh thái dương trên, phản xạ ánh dây đồng, tỷ lệ A/V giảm sâu 0.51, nguy cơ tim mạch cao.',
    'Chỉ định theo dõi huyết áp liên tục Holter 24h, hội chẩn Tim mạch tối ưu hóa phác đồ hạ áp.',
    'Right_OD', 'Fundus_Macula', 'fundus_scan_hung_20260908.png', 3420000, 'image/png',
    78, 0.51, '14.6%', 80, 52, 22, 1.41, 0.38,
    '2026-09-08 09:15:00+07', '2026-09-08 10:00:00+07'
),
-- Ca của Phạm Bích Phương (LOW)
(
    'a2000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111104',
    '22222222-2222-2222-2222-222222222224',
    '33333333-3333-3333-3333-333333333333',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'LOW', 'LOW', 'LOW', 0.94,
    'Mạng lưới mạch máu phân nhánh đều, tỷ lệ A/V 0.68 bình thường. Hoàng điểm và gai thị màu sắc sinh lý.',
    'Kết quả hoàn toàn bình thường. Khuyến nghị kiểm tra định kỳ hàng năm.',
    'Both_OD_OS', 'Fundus_Macula', 'fundus_scan_phuong_20260912.png', 2890000, 'image/png',
    18, 0.68, '18.5%', 15, 12, 5, 1.20, 0.32,
    '2026-09-12 11:00:00+07', '2026-09-12 11:30:00+07'
),
-- Ca của Đỗ Minh Tuấn (HIGH - PENDING_REVIEW)
(
    'a2000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111105',
    '22222222-2222-2222-2222-222222222225',
    '33333333-3333-3333-3333-333333333333',
    '/assets/images/fundus_original.png',
    'ANALYZED', 'HIGH', 'HIGH', NULL, 0.86,
    'Bệnh võng mạc đái tháo đường: nhiều vi phình mạch rải rác cực sau, xuất huyết chấm võng mạc nông, tỷ lệ A/V 0.53.',
    NULL,
    'Left_OS', 'Fundus_Macula', 'fundus_scan_tuan_20260914.png', 3310000, 'image/png',
    82, 0.53, '14.9%', 76, 78, 18, 1.40, 0.37,
    '2026-09-14 08:30:00+07', '2026-09-14 08:45:00+07'
),
-- Ca của Hoàng Thúy An (CRITICAL)
(
    'a2000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111106',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '/assets/images/fundus_original.png',
    'REVIEWED', 'CRITICAL', 'CRITICAL', 'CRITICAL', 0.91,
    'Bệnh võng mạc THA độ IV kết hợp phù hoàng điểm, xuất tiết cứng hình sao hoàng điểm, co hẹp tiểu động mạch nặng (A/V: 0.44).',
    'Tình trạng nguy kịch. Cần chuyển khám chuyên khoa Đáy mắt can thiệp laser/tiêm anti-VEGF và kiểm soát huyết áp khẩn cấp.',
    'Both_OD_OS', 'Fundus_Macula', 'fundus_scan_an_20260911.png', 3680000, 'image/png',
    92, 0.44, '13.2%', 94, 88, 35, 1.55, 0.42,
    '2026-09-11 16:00:00+07', '2026-09-11 17:00:00+07'
),
-- Ca của Vũ Đức Bình (LOW - PENDING_REVIEW)
(
    'a2000000-0000-0000-0000-000000000007',
    '11111111-1111-1111-1111-111111111107',
    '22222222-2222-2222-2222-222222222223',
    '33333333-3333-3333-3333-333333333333',
    '/assets/images/fundus_original.png',
    'ANALYZED', 'LOW', 'LOW', NULL, 0.92,
    'Mạch máu võng mạc sáng rõ, không ghi nhận dấu hiệu co thắt hay xơ cứng. Tỷ lệ A/V 0.66.',
    NULL,
    'Both_OD_OS', 'Fundus_Macula', 'fundus_scan_binh_20260913.png', 2950000, 'image/png',
    22, 0.66, '17.8%', 20, 15, 8, 1.22, 0.33,
    '2026-09-13 10:20:00+07', '2026-09-13 10:35:00+07'
)
ON CONFLICT (id) DO NOTHING;
