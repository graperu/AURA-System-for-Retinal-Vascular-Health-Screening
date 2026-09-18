-- V037: Cập nhật phiên bản mô hình AI hoạt động lên Gemini 3.8 Flash High (NFR-16, NFR-23)
UPDATE system_configuration
SET config_value = 'Gemini 3.8 Flash High / AURA-Core v2.4',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = 'SYSTEM'
WHERE config_key = 'ai.model.active_version';
