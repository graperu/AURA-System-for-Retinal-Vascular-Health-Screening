package com.aura.billing.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
/**
 * FR-11, FR-28: Cấu hình Merchant ID và Secret Key cho các cổng thanh toán (VNPay / MoMo).
 */
@ConfigurationProperties(prefix = "aura.payment")
public record PaymentGatewayProperties(
    VnPayProperties vnpay,
    MomoProperties momo,
    boolean sandboxMode) {
  // Getter alias hỗ trợ cả 2 cách viết vnpay() và vnPay()
  public VnPayProperties vnPay() {
    return vnpay;
  }
  public record VnPayProperties(
      String tmnCode,
      String hashSecret,
      String payUrl,
      String returnUrl) {}
  public record MomoProperties(
      String partnerCode,
      String accessKey,
      String secretKey,
      String endpoint,
      String returnUrl) {}
}