CREATE TABLE screenings (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    image_url VARCHAR(512) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    risk_level VARCHAR(32),
    confidence DOUBLE PRECISION,
    findings TEXT,
    doctor_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_screenings_patient_id ON screenings(patient_id);
CREATE INDEX idx_screenings_doctor_id ON screenings(doctor_id);
CREATE INDEX idx_screenings_status ON screenings(status);
