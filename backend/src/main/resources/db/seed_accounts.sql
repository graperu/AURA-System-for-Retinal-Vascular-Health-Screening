-- Seed 4 Concrete Accounts for each Role with password: Password123@Aura

-- 1. Patient
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'patient@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'Bệnh nhân Nguyễn Trọng Nam', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, full_name = EXCLUDED.full_name;

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'patient@aura.com'), (SELECT id FROM roles WHERE name = 'USER'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 2. Doctor
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'doctor@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'BS. CKII Nguyễn Thị Thanh', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, full_name = EXCLUDED.full_name;

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'doctor@aura.com'), (SELECT id FROM roles WHERE name = 'DOCTOR'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. Clinic
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES ('33333333-3333-3333-3333-333333333333', 'clinic@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'Phòng Khám Đa Khoa Quốc Tế AURA', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, full_name = EXCLUDED.full_name;

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'clinic@aura.com'), (SELECT id FROM roles WHERE name = 'CLINIC'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. Admin
INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
VALUES ('44444444-4444-4444-4444-444444444444', 'admin@aura.com', '$2a$10$cRNLMSqUeuvy1UajXx/H.eOMvQZk5AqPdvIiB037EnNh.tm2hoaDu', 'Quản Trị Viên Hệ Thống AURA', TRUE, TRUE, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = TRUE, full_name = EXCLUDED.full_name;

INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE email = 'admin@aura.com'), (SELECT id FROM roles WHERE name = 'ADMIN'), NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;
