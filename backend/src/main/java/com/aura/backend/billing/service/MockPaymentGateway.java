package com.aura.backend.billing.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Milestone-2 stand-in for a real payment provider: every charge instantly "succeeds" and
 * gets a fake reference id, the same way AiCoreClient's Milestone-1 mock always returns
 * riskLevel="low_mock" instead of calling a real model. No money moves, no external call
 * happens. Swap for a real gateway before going anywhere near production billing.
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public GatewayResult charge(String buyerEmail, BigDecimal amount) {
        String reference = "MOCK-" + UUID.randomUUID();
        return new GatewayResult(true, "mock", reference, null);
    }
}
