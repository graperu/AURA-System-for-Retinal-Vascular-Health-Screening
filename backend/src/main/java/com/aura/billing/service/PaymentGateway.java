package com.aura.billing.service;

import java.math.BigDecimal;

public interface PaymentGateway {

    GatewayResult charge(String buyerEmail, BigDecimal amount, String provider, String simulateOutcome);
    GatewayResult refund(String providerReference);

    record GatewayResult(boolean success, boolean pending, String providerName, String providerReference, String failureReason) {
    }
}