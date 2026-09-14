-- V033: Enhance payment_transaction table for real QR payments (VietQR, VNPay, MoMo) and IPN webhook processing

ALTER TABLE payment_transaction
    ADD COLUMN IF NOT EXISTS transfer_content VARCHAR(255),
    ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
    ADD COLUMN IF NOT EXISTS payment_url TEXT,
    ADD COLUMN IF NOT EXISTS gateway_transaction_no VARCHAR(255),
    ADD COLUMN IF NOT EXISTS checksum VARCHAR(255),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;

-- Update expires_at for existing records
UPDATE payment_transaction
SET expires_at = created_at + INTERVAL '15 minutes'
WHERE expires_at IS NULL;

-- Indexes for fast query, idempotency, and polling lookup
CREATE UNIQUE INDEX IF NOT EXISTS uk_payment_transaction_provider_ref
    ON payment_transaction(provider_reference)
    WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transaction_transfer_content
    ON payment_transaction(transfer_content);

CREATE INDEX IF NOT EXISTS idx_payment_transaction_expires_at
    ON payment_transaction(expires_at);
