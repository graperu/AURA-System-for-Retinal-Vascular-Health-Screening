-- V013: Tạo bảng lưu trữ hồ sơ thông tin cá nhân và thông tin y tế (FR-8)
CREATE TABLE IF NOT EXISTS patient_medical_profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    mrn VARCHAR(64) NOT NULL UNIQUE,
    date_of_birth DATE,
    age INT,
    gender VARCHAR(16) DEFAULT 'Other',
    phone_number VARCHAR(32),
    address VARCHAR(255),
    blood_type VARCHAR(8),
    systolic_bp INT DEFAULT 120,
    diastolic_bp INT DEFAULT 80,
    hba1c DOUBLE PRECISION DEFAULT 5.6,
    has_diabetes BOOLEAN DEFAULT FALSE,
    diabetes_type VARCHAR(32) DEFAULT 'None',
    diabetes_duration_years INT DEFAULT 0,
    has_hypertension BOOLEAN DEFAULT FALSE,
    history_of_smoking BOOLEAN DEFAULT FALSE,
    history_of_heart_disease BOOLEAN DEFAULT FALSE,
    history_of_stroke BOOLEAN DEFAULT FALSE,
    current_medications TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(32),
    assigned_doctor VARCHAR(150) DEFAULT 'BS. CKII Nguyễn Thị Thanh',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_medical_profiles_user_id ON patient_medical_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_profiles_mrn ON patient_medical_profiles(mrn);
