package com.aura.billing.service;

import java.math.BigDecimal;

/**
 * Cổng thanh toán trừu tượng hóa cho hệ thống AURA (FR-11).
 * Hỗ trợ các nhà cung cấp: VNPay, MoMo, Sandbox / Thẻ ngân hàng.
 */
public interface PaymentGateway {

    GatewayResult charge(String buyerEmail, BigDecimal amount);

    default GatewayResult charge(String buyerEmail, BigDecimal amount, String paymentMethod) {
        return charge(buyerEmail, amount);
    }

    record GatewayResult(boolean success, String providerName, String providerReference, String failureReason) {
    }
}