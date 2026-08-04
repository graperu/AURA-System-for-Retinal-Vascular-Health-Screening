package com.aura.billing.service;

import java.math.BigDecimal;

/**
 * Abstraction over "whoever actually moves money" — mirrors how AiCoreClient abstracts the
 * AI Core service. Today the only implementation is MockPaymentGateway; wiring in a real
 * provider (VNPay, Momo, Stripe) means adding a new implementation of this interface, not
 * touching BillingService or the controllers.
 */
public interface PaymentGateway {

    GatewayResult charge(String buyerEmail, BigDecimal amount);

    record GatewayResult(boolean success, String providerName, String providerReference, String failureReason) {
    }
}