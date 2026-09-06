-- V015: Gỡ bỏ default false và default assigned_doctor để hỗ trợ tri-state (true/false/null) và unassigned doctor
ALTER TABLE patient_medical_profiles ALTER COLUMN has_diabetes DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN diabetes_type DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN diabetes_duration_years DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN has_hypertension DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN history_of_smoking DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN history_of_heart_disease DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN history_of_stroke DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN assigned_doctor DROP DEFAULT;
