CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    mrn VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    age INT,
    gender VARCHAR(20) NOT NULL DEFAULT 'Other',
    phone VARCHAR(50),
    address VARCHAR(255),
    systolic_bp INT DEFAULT 120,
    diastolic_bp INT DEFAULT 80,
    hba1c NUMERIC(4,2) DEFAULT 5.7,
    has_diabetes BOOLEAN DEFAULT FALSE,
    has_hypertension BOOLEAN DEFAULT FALSE,
    history_of_smoking BOOLEAN DEFAULT FALSE,
    last_exam_date VARCHAR(32),
    assigned_doctor VARCHAR(150) DEFAULT 'BS. CKII Nguyễn Thị Thanh',
    risk_score INT DEFAULT 25,
    risk_level VARCHAR(32) DEFAULT 'LOW',
    review_status VARCHAR(32) DEFAULT 'PENDING_REVIEW',
    findings_summary TEXT,
    avatar_color VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_mrn ON patient_profiles(mrn);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_risk_score ON patient_profiles(risk_score);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_created_at ON patient_profiles(created_at);
