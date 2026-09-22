-- V046: Add separate fields for original AI findings vs doctor validated/edited findings (FR-15)
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS ai_findings TEXT;
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS doctor_findings TEXT;

-- Backfill existing screenings: if ai_findings is null, initialize with existing findings
UPDATE screenings 
SET ai_findings = findings 
WHERE ai_findings IS NULL AND findings IS NOT NULL;
