-- V036: Tạo bảng cấu hình hệ thống động (Zero-Downtime Dynamic Configuration)
-- Cung cấp cấu hình ngưỡng AI, phiên bản mô hình hoạt động và truy xuất nguồn gốc (NFR-16, NFR-23)

CREATE TABLE IF NOT EXISTS system_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM'
);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_configuration(config_key);

-- Seed default AI parameters, risk thresholds & calibration scores (NFR-16, NFR-23)
INSERT INTO system_configuration (id, config_key, config_value, description, updated_at, updated_by)
VALUES
    (gen_random_uuid(), 'ai.risk.critical_threshold', '80', 'Ngưỡng nguy cơ rất cao (Critical) - can thiệp khẩn cấp', CURRENT_TIMESTAMP, 'SYSTEM'),
    (gen_random_uuid(), 'ai.risk.high_threshold', '65', 'Ngưỡng nguy cơ cao (High) - cần bác sĩ thẩm định', CURRENT_TIMESTAMP, 'SYSTEM'),
    (gen_random_uuid(), 'ai.risk.moderate_threshold', '40', 'Ngưỡng nguy cơ trung bình (Moderate)', CURRENT_TIMESTAMP, 'SYSTEM'),
    (gen_random_uuid(), 'ai.model.active_version', 'Gemini 3.7 Flash High / AURA-Core v2.4', 'Phiên bản mô hình AI suy luận hoạt động', CURRENT_TIMESTAMP, 'SYSTEM'),
    (gen_random_uuid(), 'ai.calibration.brier_score', '0.058', 'Chỉ số hiệu chuẩn Brier Score mô hình AI', CURRENT_TIMESTAMP, 'SYSTEM'),
    (gen_random_uuid(), 'ai.calibration.method', 'Platt-Scaling', 'Phương pháp hiệu chuẩn xác suất AI', CURRENT_TIMESTAMP, 'SYSTEM')
ON CONFLICT (config_key) DO NOTHING;

-- Bổ sung trường truy xuất nguồn gốc mô hình AI trên thực thể sàng lọc (NFR-23)
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS ai_model_version VARCHAR(100);
ALTER TABLE screenings ADD COLUMN IF NOT EXISTS applied_thresholds VARCHAR(255);
