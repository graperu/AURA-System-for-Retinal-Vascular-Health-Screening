-- V016: Tạo bảng phân công Bác sĩ - Bệnh nhân (FR-13 Foundation & RBAC Security)
CREATE TABLE IF NOT EXISTS doctor_patient_assignments (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dpa_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_doctor_patient_assignment UNIQUE (doctor_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_dpa_doctor_id ON doctor_patient_assignments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_dpa_patient_id ON doctor_patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_dpa_status ON doctor_patient_assignments(status);
CREATE INDEX IF NOT EXISTS idx_dpa_doctor_status ON doctor_patient_assignments(doctor_id, status);

-- Seed initial assignment for default Doctor & Patient test accounts if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = '22222222-2222-2222-2222-222222222222') 
     AND EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111') THEN
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
  END IF;
END $$;