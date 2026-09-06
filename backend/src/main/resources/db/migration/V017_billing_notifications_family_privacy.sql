-- FR-9 / FR-11 / FR-12 / FR-User-Plus: billing extras, notifications, family, privacy

ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(64);
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS original_amount NUMERIC(12, 2);
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(64);
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(255);

ALTER TABLE subscription ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS voucher (
    code VARCHAR(64) PRIMARY KEY,
    description TEXT,
    percent_off INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0
);

INSERT INTO voucher (code, description, percent_off, active, max_uses, used_count)
VALUES
    ('AURA10', 'Giam 10% hoc ky / khach hang moi', 10, TRUE, 500, 0),
    ('TET2026', 'Khuyen mai Tet 20%', 20, TRUE, 200, 0),
    ('FAMILY15', 'Goi gia dinh giam 15%', 15, TRUE, 300, 0)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    channels VARCHAR(128) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    critical BOOLEAN NOT NULL DEFAULT FALSE,
    related_resource_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification(created_at);

CREATE TABLE IF NOT EXISTS notification_preference (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    web_push BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ai_ready BOOLEAN NOT NULL DEFAULT TRUE,
    doctor_message BOOLEAN NOT NULL DEFAULT TRUE,
    appointment_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    low_credit BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_member (
    id UUID PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(150) NOT NULL,
    relationship VARCHAR(32) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_family_member_owner ON family_member(owner_user_id);

CREATE TABLE IF NOT EXISTS privacy_setting (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    allow_anonymous_ai_training BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
