package com.aura.billing.entity;

/** PENDING while the (mock) gateway processes it, then SUCCEEDED or FAILED. Never mutated after that. */
public enum PaymentStatus {
    PENDING,
    SUCCEEDED,
    FAILED
}