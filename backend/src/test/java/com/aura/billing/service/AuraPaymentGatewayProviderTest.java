package com.aura.billing.service;

import static org.junit.jupiter.api.Assertions.*;

import com.aura.billing.config.PaymentGatewayProperties;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AuraPaymentGatewayProviderTest {

    private AuraPaymentGatewayProvider provider;
    private PaymentGatewayProperties properties;

    @BeforeEach
    void setUp() {
        properties = new PaymentGatewayProperties();
        provider = new AuraPaymentGatewayProvider(properties);
    }

    @Test
    @DisplayName("FR-11/FR-28: Khởi tạo giao dịch VNPay thành công với Merchant TMN Code và SecureHash")
    void charge_vnpay_success() {
        PaymentGateway.GatewayResult result = provider.charge("patient@aura.com", BigDecimal.valueOf(200000), "VNPAY");

        assertTrue(result.success());
        assertEquals("VNPAY_GATEWAY", result.providerName());
        assertEquals(properties.getVnpay().getTmnCode(), result.merchantId());
        assertNotNull(result.providerReference());
        assertTrue(result.providerReference().startsWith("VNP_"));
        assertNotNull(result.paymentUrl());
        assertTrue(result.paymentUrl().contains("vnp_SecureHash="));
        assertTrue(result.paymentUrl().contains("vnp_TmnCode=" + properties.getVnpay().getTmnCode()));
    }

    @Test
    @DisplayName("FR-11/FR-28: Khởi tạo giao dịch MoMo thành công với Partner Code và Signature")
    void charge_momo_success() {
        PaymentGateway.GatewayResult result = provider.charge("clinic@aura.com", BigDecimal.valueOf(3500000), "MOMO");

        assertTrue(result.success());
        assertEquals("MOMO_WALLET", result.providerName());
        assertEquals(properties.getMomo().getPartnerCode(), result.merchantId());
        assertNotNull(result.providerReference());
        assertTrue(result.providerReference().startsWith("MOMO_"));
        assertNotNull(result.paymentUrl());
        assertTrue(result.paymentUrl().contains("partnerCode=" + properties.getMomo().getPartnerCode()));
        assertTrue(result.paymentUrl().contains("signature="));
    }

    @Test
    @DisplayName("FR-11: Từ chối số tiền không hợp lệ")
    void charge_invalid_amount() {
        PaymentGateway.GatewayResult result = provider.charge("user@aura.com", BigDecimal.ZERO, "VNPAY");

        assertFalse(result.success());
        assertNotNull(result.failureReason());
    }
}
