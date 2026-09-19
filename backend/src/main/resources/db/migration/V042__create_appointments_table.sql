-- V042: Tạo bảng appointments quản lý lịch hẹn khám và tư vấn hai chiều (Bệnh nhân - Bác sĩ)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(32) NOT NULL,
    reason VARCHAR(500),
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_appointment_status CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

-- Seed initial appointments for default Doctor and Patient accounts if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = '22222222-2222-2222-2222-222222222222') 
     AND EXISTS (SELECT 1 FROM users WHERE id = '11111111-1111-1111-1111-111111111111') THEN
    INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, time_slot, reason, notes, status, created_at, updated_at)
    VALUES 
    (
        '77777777-7777-7777-7777-777777777771',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        CURRENT_DATE,
        '09:30',
        'Tư vấn kết quả tầm soát vi mạch võng mạc & bệnh võng mạc ĐTĐ',
        'Bệnh nhân có triệu chứng nhìn mờ về chiều',
        'CONFIRMED',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '77777777-7777-7777-7777-777777777772',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        CURRENT_DATE + INTERVAL '1 day',
        '14:15',
        'Tái khám định kỳ theo dõi chỉ số AVR và tổn thương vi phình mạch',
        NULL,
        'PENDING',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
