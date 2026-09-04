CREATE TABLE IF NOT EXISTS service_package (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope VARCHAR(32) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    credits INTEGER NOT NULL,
    validity_days INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription (
    id BIGSERIAL PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_package_id BIGINT NOT NULL REFERENCES service_package(id),
    remaining_credits INTEGER NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_subscription_owner_package UNIQUE (owner_id, service_package_id)
);

CREATE INDEX IF NOT EXISTS idx_subscription_owner_id ON subscription(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscription_status ON subscription(status);

CREATE TABLE IF NOT EXISTS payment_transaction (
    id BIGSERIAL PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_package_id BIGINT NOT NULL REFERENCES service_package(id),
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    provider VARCHAR(255) NOT NULL,
    provider_reference VARCHAR(255),
    failure_reason VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_transaction_buyer_id ON payment_transaction(buyer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_status ON payment_transaction(status);

INSERT INTO service_package (name, description, scope, price, credits, validity_days, active)
VALUES
    ('Goi Sang Loc Ca Nhan Co Ban', 'Phu hop nguoi dung ca nhan theo doi dinh ky', 'INDIVIDUAL', 150000.00, 5, 30, TRUE),
    ('Goi Sang Loc Chuyen Sau (Pro)', 'Danh cho benh nhan co nguy co cao can theo doi thuong xuyen', 'INDIVIDUAL', 350000.00, 15, 90, TRUE),
    ('Goi Phong Kham Chien Dich (Clinic Batch)', 'Danh cho phong kham sang loc cong dong quy mo lon', 'CLINIC', 2000000.00, 200, 365, TRUE)
ON CONFLICT DO NOTHING;
