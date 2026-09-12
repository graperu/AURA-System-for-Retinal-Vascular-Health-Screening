-- V026: Gán phân quyền chuẩn (Roles) và dữ liệu liên kết cho 4 tài khoản mẫu (Patient, Doctor, Clinic, Admin)

-- 1. Đảm bảo 4 roles tồn tại
INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'USER', 'Default authenticated user', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'DOCTOR', 'Assigned clinical reviewer', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'ADMIN', 'System administrator', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', 'CLINIC', 'Clinic/organization account', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Đảm bảo 4 tài khoản mặc định tồn tại
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'patient@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'Bệnh nhân Nguyễn Trọng Nam', TRUE, TRUE, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'doctor@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'BS. CKII Nguyễn Thị Thanh', TRUE, TRUE, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'clinic@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'Phòng khám Đa khoa AURA', TRUE, TRUE, NOW(), NOW()),
    ('44444444-4444-4444-4444-444444444444', 'admin@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'Quản trị viên Hệ thống', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, full_name = EXCLUDED.full_name;

-- 3. Gán Role chính xác cho từng tài khoản vào user_roles
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES 
    (gen_random_uuid(), (SELECT id FROM users WHERE email = 'patient@aura.com'), (SELECT id FROM roles WHERE name = 'USER'), NOW()),
    (gen_random_uuid(), (SELECT id FROM users WHERE email = 'doctor@aura.com'), (SELECT id FROM roles WHERE name = 'DOCTOR'), NOW()),
    (gen_random_uuid(), (SELECT id FROM users WHERE email = 'clinic@aura.com'), (SELECT id FROM roles WHERE name = 'CLINIC'), NOW()),
    (gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@aura.com'), (SELECT id FROM roles WHERE name = 'ADMIN'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. Liên kết hồ sơ bệnh nhân cho Nguyễn Trọng Nam
UPDATE patient_profiles 
SET user_id = '11111111-1111-1111-1111-111111111111' 
WHERE mrn = 'MRN-2026-0941' OR full_name = 'Bệnh nhân Nguyễn Trọng Nam';

-- 5. Thiết lập phân công Bác sĩ (doctor@aura.com) và Bệnh nhân (patient@aura.com)
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
ON CONFLICT (doctor_id, patient_id) DO NOTHING;

-- 6. Thiết lập hồ sơ phòng khám mẫu và phê duyệt cho clinic@aura.com
INSERT INTO clinic_profiles (id, user_id, organization_name, license_number, verification_status, submitted_at, reviewed_at, reviewed_by, created_at, updated_at)
VALUES (
    '66666666-6666-6666-6666-666666666661',
    '33333333-3333-3333-3333-333333333333',
    'Phòng khám Đa khoa AURA',
    'GPHD-79/BYT-2026',
    'APPROVED',
    NOW(),
    NOW(),
    '44444444-4444-4444-4444-444444444444',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET verification_status = 'APPROVED', organization_name = EXCLUDED.organization_name;

-- 7. Liên kết Bác sĩ trực thuộc Phòng khám
INSERT INTO clinic_members (id, clinic_id, doctor_id, status, invited_at, created_at, updated_at)
VALUES (
    '77777777-7777-7777-7777-777777777771',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'ACTIVE',
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (clinic_id, doctor_id) DO NOTHING;
