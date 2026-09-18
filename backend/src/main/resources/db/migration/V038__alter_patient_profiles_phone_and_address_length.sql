-- V038: Align patient_profiles columns with entity AES-GCM encrypted field lengths
ALTER TABLE patient_profiles ALTER COLUMN phone TYPE VARCHAR(255);
ALTER TABLE patient_profiles ALTER COLUMN address TYPE VARCHAR(500);
