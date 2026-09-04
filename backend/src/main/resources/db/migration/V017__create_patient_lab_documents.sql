CREATE TABLE patient_lab_documents (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
    content BYTEA NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_lab_documents_patient
    ON patient_lab_documents(patient_id, uploaded_at DESC);
