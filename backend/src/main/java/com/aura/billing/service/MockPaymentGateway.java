package com.aura.billing.service;

import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Cổng thanh toán 
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

  @Override
  public GatewayResult charge(String buyerEmail, BigDecimal amount, String provider, String simulateOutcome) {
    String outcome = simulateOutcome == null || simulateOutcome.isBlank() ? "SUCCESS" : simulateOutcome.trim().toUpperCase();
    String method = provider == null ? "VNPAY" : provider.toUpperCase();
    if ("VIETQR".equals(method) && "SUCCESS".equals(outcome)) {
      outcome = "PENDING";
    }
    String reference = method + "-" + UUID.randomUUID();
    if ("FAILED".equals(outcome) || "FAIL".equals(outcome)) {
      return new GatewayResult(false, false, method, reference, "Cổng " + method + " từ chối giao dịch (demo thất bại).");
    }
    if ("PENDING".equals(outcome)) {
      return new GatewayResult(false, true, method, reference, null);
    }
    return new GatewayResult(true, false, method, reference, null);
  }

  @Override
  public GatewayResult refund(String providerReference) {
    return new GatewayResult(true, false, "REFUND", providerReference, null);
  }
}
