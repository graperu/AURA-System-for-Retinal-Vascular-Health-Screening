CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(320),
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS doctor_feedback (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    screening_id UUID NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
    ai_risk_level VARCHAR(32) NOT NULL,
    doctor_risk_level VARCHAR(32) NOT NULL,
    is_accurate BOOLEAN NOT NULL,
    feedback_notes TEXT,
    vessel_annotation_data TEXT,
    included_in_retraining BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_feedback_doctor_id ON doctor_feedback(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_feedback_screening_id ON doctor_feedback(screening_id);
CREATE INDEX IF NOT EXISTS idx_doctor_feedback_retraining ON doctor_feedback(included_in_retraining);
