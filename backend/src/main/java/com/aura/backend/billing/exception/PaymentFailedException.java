package com.aura.backend.billing.exception;

/** The (mock) gateway declined the charge. Kept as a distinct type so a real gateway's
 *  decline reasons can be surfaced the same way later without changing calling code. */
public class PaymentFailedException extends RuntimeException {
    public PaymentFailedException(String reason) {
        super(reason);
    }
}
