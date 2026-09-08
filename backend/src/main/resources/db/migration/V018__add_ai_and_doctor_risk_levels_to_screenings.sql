-- V018: Add separate fields for original AI risk vs validated Doctor risk (FR-15 & P0-4)
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS ai_risk_level VARCHAR(32);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS doctor_risk_level VARCHAR(32);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
