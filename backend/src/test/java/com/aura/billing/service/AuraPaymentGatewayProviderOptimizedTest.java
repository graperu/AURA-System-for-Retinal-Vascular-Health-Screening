package com.aura.billing.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.billing.config.PaymentGatewayProperties;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

@DisplayName("AuraPaymentGatewayProvider - Optimized HMAC Branches & Fallback Tests")
class AuraPaymentGatewayProviderOptimizedTest {

  private AuraPaymentGatewayProvider provider;
  private PaymentGatewayProperties properties;

  @BeforeEach
  void setUp() {
    PaymentGatewayProperties.VnPayProperties vnpay =
        new PaymentGatewayProperties.VnPayProperties(
            "AURA_VNPAY_TMN",
            "SECRET_KEY_VNPAY_512",
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            "http://localhost:5173/billing/vnpay-return",
            "2.1.0",
            "pay",
            "VND");

    PaymentGatewayProperties.MomoProperties momo =
        new PaymentGatewayProperties.MomoProperties(
            "MOMO_AURA_PARTNER",
            "MOMO_ACCESS_KEY",
            "MOMO_SECRET_KEY_256",
            "https://test-payment.momo.vn/v2/gateway/api/create",
            "http://localhost:5173/billing/momo-return",
            "http://localhost:8080/api/v1/billing/webhook/momo",
            "captureWallet");

    properties = new PaymentGatewayProperties(vnpay, momo, true);
    provider = new AuraPaymentGatewayProvider(properties);
  }

  @Test
  @DisplayName("hmacSha256 & hmacSha512: Fallback tạo mã ngẫu nhiên 32 ký tự không dấu gạch ngang khi gặp lỗi null")
  void testHmacFallbackWhenExceptionOccurs() throws Exception {
    Method hmacSha256Method = AuraPaymentGatewayProvider.class.getDeclaredMethod("hmacSha256", String.class, String.class);
    hmacSha256Method.setAccessible(true);

    Method hmacSha512Method = AuraPaymentGatewayProvider.class.getDeclaredMethod("hmacSha512", String.class, String.class);
    hmacSha512Method.setAccessible(true);

    // Khi key là null -> gây ngoại lệ NullPointerException -> trả về random UUID 32 ký tự
    String fallback256 = (String) hmacSha256Method.invoke(null, null, "dataToSign");
    assertThat(fallback256).isNotNull().hasSize(32).doesNotContain("-");

    String fallback512 = (String) hmacSha512Method.invoke(null, null, "dataToSign");
    assertThat(fallback512).isNotNull().hasSize(32).doesNotContain("-");
  }

  @Test
  @DisplayName("hmacSha256 & hmacSha512: Tạo chữ ký mã hóa chuẩn xác theo chuẩn SHA-256 (64 hex) và SHA-512 (128 hex)")
  void testHmacCalculationSuccess() throws Exception {
    Method hmacSha256Method = AuraPaymentGatewayProvider.class.getDeclaredMethod("hmacSha256", String.class, String.class);
    hmacSha256Method.setAccessible(true);

    Method hmacSha512Method = AuraPaymentGatewayProvider.class.getDeclaredMethod("hmacSha512", String.class, String.class);
    hmacSha512Method.setAccessible(true);

    String signature256 = (String) hmacSha256Method.invoke(null, "my_secret_key", "sample data to hash");
    assertThat(signature256).isNotNull().hasSize(64).matches("^[a-f0-9]{64}$");

    String signature512 = (String) hmacSha512Method.invoke(null, "my_secret_key", "sample data to hash");
    assertThat(signature512).isNotNull().hasSize(128).matches("^[a-f0-9]{128}$");
  }

  @ParameterizedTest(name = "Payment method \"{0}\" -> Provider Name: {1}")
  @CsvSource({
    "MOMO, MOMO_WALLET",
    "CREDIT_CARD, CREDIT_CARD",
    "VISA, CREDIT_CARD",
    "MASTERCARD, CREDIT_CARD",
    "VNPAY, VNPAY_GATEWAY",
    "UNKNOWN_GATEWAY, VNPAY_GATEWAY"
  })
  @DisplayName("charge: Kiểm tra toàn bộ các nhánh phương thức thanh toán trong switch case")
  void testChargePaymentMethodSwitchCase(String paymentMethod, String expectedProvider) {
    PaymentGateway.GatewayResult result = provider.charge("buyer@aurascreening.ai", BigDecimal.valueOf(500000), paymentMethod);

    assertThat(result.success()).isTrue();
    assertThat(result.providerName()).isEqualTo(expectedProvider);
    assertThat(result.paymentUrl()).isNotBlank();
    assertThat(result.providerReference()).isNotBlank();
  }

  @Test
  @DisplayName("charge: Overload charge(buyerEmail, amount) mặc định sử dụng cổng VNPAY")
  void testChargeDefaultOverloadUsesVnpay() {
    PaymentGateway.GatewayResult result = provider.charge("buyer@aurascreening.ai", BigDecimal.valueOf(250000));

    assertThat(result.success()).isTrue();
    assertThat(result.providerName()).isEqualTo("VNPAY_GATEWAY");
    assertThat(result.paymentUrl()).contains("vnp_SecureHash=");
  }

  @ParameterizedTest(name = "Amount: {0}")
  @ValueSource(strings = {"0", "-1000", "-0.01"})
  @DisplayName("charge: Trả về kết quả thất bại khi số tiền bằng 0 hoặc âm")
  void testChargeInvalidAmountReturnsFailure(String amountStr) {
    BigDecimal amount = new BigDecimal(amountStr);

    PaymentGateway.GatewayResult result = provider.charge("buyer@aurascreening.ai", amount, "VNPAY");

    assertThat(result.success()).isFalse();
    assertThat(result.failureReason()).isEqualTo("Số tiền thanh toán không hợp lệ.");
    assertThat(result.providerReference()).isNull();
  }

  @Test
  @DisplayName("charge: Trả về kết quả thất bại khi số tiền là null")
  void testChargeNullAmountReturnsFailure() {
    PaymentGateway.GatewayResult result = provider.charge("buyer@aurascreening.ai", null, "VNPAY");

    assertThat(result.success()).isFalse();
    assertThat(result.failureReason()).isEqualTo("Số tiền thanh toán không hợp lệ.");
    assertThat(result.providerReference()).isNull();
  }
}
