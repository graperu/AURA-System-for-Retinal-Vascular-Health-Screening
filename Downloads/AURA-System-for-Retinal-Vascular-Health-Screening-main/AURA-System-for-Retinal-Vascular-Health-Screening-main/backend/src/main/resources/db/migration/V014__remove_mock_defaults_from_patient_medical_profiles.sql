-- V014: Gỡ bỏ các giá trị DEFAULT y tế giả định (120/80 mmHg, 5.6% HbA1c) để đảm bảo tính xác thực lâm sàng
ALTER TABLE patient_medical_profiles ALTER COLUMN systolic_bp DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN diastolic_bp DROP DEFAULT;
ALTER TABLE patient_medical_profiles ALTER COLUMN hba1c DROP DEFAULT;
