package com.aura.billing.entity;

/** PENDING while the gateway processes it, then SUCCEEDED or FAILED. */
public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED
}
