package com.aura.billing.exception;

/** The configured payment gateway could not complete the charge. */
public class PaymentFailedException extends RuntimeException {
    public PaymentFailedException(String reason) {
        super(reason);
    }
}
