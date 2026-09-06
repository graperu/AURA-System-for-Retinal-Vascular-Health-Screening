package com.aura.billing.service;

import java.math.BigDecimal;

/**
 * Abstraction over "whoever actually moves money" — mirrors how AiCoreClient abstracts the
 * AI Core service. A real provider (VNPay, Momo, Stripe) can be added without changing
 * BillingService or the controllers. The default implementation fails closed.
 */
public interface PaymentGateway {

    GatewayResult charge(String buyerEmail, BigDecimal amount);

    record GatewayResult(boolean success, String providerName, String providerReference, String failureReason) {
    }
}
