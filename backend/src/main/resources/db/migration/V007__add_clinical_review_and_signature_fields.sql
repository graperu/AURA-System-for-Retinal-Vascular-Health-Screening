ALTER TABLE screenings
    ADD COLUMN IF NOT EXISTS review_decision VARCHAR(16),
    ADD COLUMN IF NOT EXISTS original_ai_risk_level VARCHAR(32),
    ADD COLUMN IF NOT EXISTS doctor_cardiovascular_risk_level VARCHAR(32),
    ADD COLUMN IF NOT EXISTS doctor_diabetic_retinopathy_risk_level VARCHAR(32),
    ADD COLUMN IF NOT EXISTS icd10_codes TEXT,
    ADD COLUMN IF NOT EXISTS digital_signature TEXT,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;