-- V039: Add version column for optimistic locking (CON-02, CON-03), functional index for VietQR (BIL-03), and phone_hash blind index (CON-01)

-- 1. Add version column to subscription for optimistic locking (CON-02)
ALTER TABLE subscription
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 2. Add version column to payment_transaction for optimistic locking (CON-03)
ALTER TABLE payment_transaction
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 3. Add functional index for case-insensitive and trimmed VietQR transfer content lookup (BIL-03)
CREATE INDEX IF NOT EXISTS idx_payment_transaction_transfer_content_lower
    ON payment_transaction (LOWER(TRIM(transfer_content)));

-- 4. Add phone_hash blind index column and B-tree index to patient_profiles (CON-01)
ALTER TABLE patient_profiles
    ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_phone_hash
    ON patient_profiles (phone_hash);