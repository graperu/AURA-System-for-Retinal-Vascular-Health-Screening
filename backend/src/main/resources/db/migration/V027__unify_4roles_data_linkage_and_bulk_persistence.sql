-- V027: Đồng bộ liên kết dữ liệu 100% cho 4 vai trò (USER, DOCTOR, CLINIC, ADMIN),
-- xóa bỏ mock data/dữ liệu mồ côi và khởi tạo bảng lưu trữ sàng lọc hàng loạt (Bulk Screening).

-- 1. Khởi tạo bảng doctor_profiles và seed hồ sơ cho BS. CKII Nguyễn Thị Thanh
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialty VARCHAR(150),
    hospital VARCHAR(255),
    title VARCHAR(100),
    license_number VARCHAR(100),
    years_of_experience INT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_user_id ON doctor_profiles(user_id);

INSERT INTO doctor_profiles (
    id, user_id, specialty, hospital, title, license_number, years_of_experience, bio, created_at, updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222220',
    '22222222-2222-2222-2222-222222222222',
    'Nhãn khoa - Dịch kính Võng mạc',
    'Bệnh viện Mắt Trung ương / Cố vấn AURA Clinic',
    'BS. CKII',
    'CCHN-001234/BYT',
    18,
    'Chuyên gia đầu ngành về bệnh võng mạc đái tháo đường và phân tích vi mạch đáy mắt.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    hospital = EXCLUDED.hospital,
    title = EXCLUDED.title,
    license_number = EXCLUDED.license_number,
    years_of_experience = EXCLUDED.years_of_experience,
    bio = EXCLUDED.bio;

-- 2. Đảm bảo 4 roles tồn tại (USER, DOCTOR, CLINIC, ADMIN)
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'USER', 'Default authenticated user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000002', 'DOCTOR', 'Assigned clinical reviewer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000003', 'ADMIN', 'System administrator', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000004', 'CLINIC', 'Clinic/organization account', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 3. Gán quyền chính xác vào user_roles cho 4 tài khoản hệ thống chuẩn
DELETE FROM user_roles WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);

INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES
('00000000-0000-0000-0001-000000000001', '11111111-1111-1111-1111-111111111111', (SELECT id FROM roles WHERE name = 'USER'), CURRENT_TIMESTAMP),
('00000000-0000-0000-0001-000000000002', '22222222-2222-2222-2222-222222222222', (SELECT id FROM roles WHERE name = 'DOCTOR'), CURRENT_TIMESTAMP),
('00000000-0000-0000-0001-000000000003', '33333333-3333-3333-3333-333333333333', (SELECT id FROM roles WHERE name = 'CLINIC'), CURRENT_TIMESTAMP),
('00000000-0000-0000-0001-000000000004', '44444444-4444-4444-4444-444444444444', (SELECT id FROM roles WHERE name = 'ADMIN'), CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. Seed clinic_profiles cho clinic@aura.com với trạng thái APPROVED
INSERT INTO clinic_profiles (
    id, user_id, organization_name, license_number, license_document_url,
    verification_status, rejection_reason, submitted_at, reviewed_at, reviewed_by, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333330',
    '33333333-3333-3333-3333-333333333333',
    'Phòng khám Đa khoa AURA',
    'GPHĐ-019284-SYT-HN',
    'https://aura.com/docs/licenses/GPHD-019284-SYT-HN.pdf',
    'APPROVED',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    '44444444-4444-4444-4444-444444444444',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
    organization_name = EXCLUDED.organization_name,
    license_number = EXCLUDED.license_number,
    verification_status = 'APPROVED',
    reviewed_at = CURRENT_TIMESTAMP,
    reviewed_by = '44444444-4444-4444-4444-444444444444';

-- 5. Seed liên kết clinic_members giữa Phòng khám AURA và Bác sĩ Thanh (ACTIVE)
INSERT INTO clinic_members (id, clinic_id, doctor_id, status, invited_at, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333331',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (clinic_id, doctor_id) DO UPDATE SET status = 'ACTIVE';

-- 6. Seed hồ sơ patient_medical_profiles cho Bệnh nhân Nguyễn Trọng Nam (MRN-2026-0941)
INSERT INTO patient_medical_profiles (
    id, user_id, mrn, date_of_birth, age, gender, phone_number, address, blood_type,
    systolic_bp, diastolic_bp, hba1c, has_diabetes, diabetes_type, diabetes_duration_years,
    has_hypertension, history_of_smoking, history_of_heart_disease, history_of_stroke,
    current_medications, allergies, emergency_contact_name, emergency_contact_phone,
    assigned_doctor, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111120',
    '11111111-1111-1111-1111-111111111111',
    'MRN-2026-0941',
    '1978-05-14', 48, 'Nam', '0912345678', 'Hà Nội, Việt Nam', 'O+',
    135, 85, 6.8, TRUE, 'Type 2', 4,
    TRUE, FALSE, FALSE, FALSE,
    'Metformin 500mg, Amlodipine 5mg', 'Không', 'Nguyễn Thu Trang', '0987654321',
    'BS. CKII Nguyễn Thị Thanh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
    mrn = EXCLUDED.mrn,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    phone_number = EXCLUDED.phone_number,
    has_diabetes = EXCLUDED.has_diabetes,
    has_hypertension = EXCLUDED.has_hypertension,
    assigned_doctor = EXCLUDED.assigned_doctor;

-- Đồng thời đảm bảo bản ghi liên kết cho Nam trong patient_profiles (FR-18 worklist)
INSERT INTO patient_profiles (
    id, user_id, mrn, full_name, age, gender, phone, address,
    systolic_bp, diastolic_bp, hba1c, has_diabetes, has_hypertension, history_of_smoking,
    last_exam_date, assigned_doctor, risk_score, risk_level, review_status,
    findings_summary, avatar_color, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111130',
    '11111111-1111-1111-1111-111111111111',
    'MRN-2026-0941',
    'Bệnh nhân Nguyễn Trọng Nam',
    48, 'Nam', '0912345678', 'Hà Nội, Việt Nam',
    135, 85, 6.8, TRUE, TRUE, FALSE,
    '2026-09-03', 'BS. CKII Nguyễn Thị Thanh', 85, 'HIGH', 'REVIEWED',
    'Bắt chéo động-tĩnh mạch (Gunn sign), hẹp lòng mạch tiểu động mạch độ II, co hẹp vi mạch đáy mắt.',
    'from-red-500 to-rose-600', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT (mrn) DO UPDATE SET
    user_id = '11111111-1111-1111-1111-111111111111',
    full_name = EXCLUDED.full_name,
    assigned_doctor = EXCLUDED.assigned_doctor,
    risk_level = EXCLUDED.risk_level,
    review_status = EXCLUDED.review_status;

-- 7. Seed phân công doctor_patient_assignments giữa Bác sĩ Thanh và Bệnh nhân Nam (ACTIVE)
INSERT INTO doctor_patient_assignments (id, doctor_id, patient_id, status, assigned_at, created_at, updated_at)
VALUES (
    '55555555-5555-5555-5555-555555555551',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (doctor_id, patient_id) DO UPDATE SET status = 'ACTIVE';

-- 8. Thêm cột clinic_id và batch_id vào screenings, cập nhật 9 ca khám mẫu sang clinic AURA
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS batch_id UUID;
CREATE INDEX IF NOT EXISTS idx_screenings_clinic_id ON screenings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_screenings_batch_id ON screenings(batch_id);

UPDATE screenings
SET clinic_id = '33333333-3333-3333-3333-333333333333'
WHERE id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
    'a1000000-0000-0000-0000-000000000009'
);

-- 9. Tạo bảng bulk_screening_batches và bulk_screening_items
CREATE TABLE IF NOT EXISTS bulk_screening_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(100) NOT NULL UNIQUE,
    clinic_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_images INT NOT NULL DEFAULT 0,
    processed_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_batch_status CHECK (status IN ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_bulk_batches_clinic_id ON bulk_screening_batches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_status ON bulk_screening_batches(status);
CREATE INDEX IF NOT EXISTS idx_bulk_batches_created_at ON bulk_screening_batches(created_at DESC);

CREATE TABLE IF NOT EXISTS bulk_screening_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES bulk_screening_batches(id) ON DELETE CASCADE,
    item_code VARCHAR(100),
    file_name VARCHAR(255),
    eye_position VARCHAR(32),
    pseudonym_patient_id VARCHAR(128),
    patient_name VARCHAR(150),
    raw_mrn VARCHAR(64),
    patient_age INT,
    patient_gender VARCHAR(16),
    systolic_bp INT,
    diastolic_bp INT,
    hba1c NUMERIC(4, 2),
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
    duration_ms BIGINT DEFAULT 0,
    risk_level VARCHAR(32),
    risk_score INT,
    confidence DOUBLE PRECISION,
    findings TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_batch_item_status CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_bulk_items_batch_id ON bulk_screening_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_items_status ON bulk_screening_items(status);
CREATE INDEX IF NOT EXISTS idx_bulk_items_risk_level ON bulk_screening_items(risk_level);

-- 10. Thêm user_role và module vào audit_logs kèm index
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS module VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);

-- 11. Xóa bỏ dữ liệu mồ côi trong patient_profiles (user_id IS NULL)
DELETE FROM patient_profiles WHERE user_id IS NULL;

-- 12. Cấp hạn mức subscription 200 credit cho phòng khám AURA
INSERT INTO subscription (owner_id, service_package_id, remaining_credits, expires_at, status, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM service_package WHERE scope = 'CLINIC' LIMIT 1),
    200,
    NOW() + INTERVAL '365 days',
    'ACTIVE',
    NOW(),
    NOW()
)
ON CONFLICT (owner_id, service_package_id) DO UPDATE SET
    remaining_credits = 200,
    status = 'ACTIVE',
    expires_at = NOW() + INTERVAL '365 days';
