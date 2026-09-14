package com.aura.billing.entity;

/** PENDING while waiting for payment, then SUCCEEDED, FAILED, EXPIRED, or CANCELLED. */
public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED,
    EXPIRED,
    CANCELLED
}

