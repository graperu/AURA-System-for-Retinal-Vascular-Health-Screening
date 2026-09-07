INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000004', 'CLINIC', 'Clinic/organization account', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;