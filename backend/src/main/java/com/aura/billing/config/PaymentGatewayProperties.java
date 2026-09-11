package com.aura.billing.config;
import org.springframework.boot.context.properties.ConfigurationProperties;
/**
 * FR-11, FR-28: Cấu hình Merchant ID và Secret Key cho các cổng thanh toán (VNPay / MoMo).
 */
@ConfigurationProperties(prefix = "payment")
public record PaymentGatewayProperties(
    VnPayProperties vnpay,
    MomoProperties momo,
    boolean sandboxMode) {

  public PaymentGatewayProperties() {
    this(new VnPayProperties(), new MomoProperties(), true);
  }

  public PaymentGatewayProperties(VnPayProperties vnpay, MomoProperties momo, boolean sandboxMode) {
    this.vnpay = vnpay != null ? vnpay : new VnPayProperties();
    this.momo = momo != null ? momo : new MomoProperties();
    this.sandboxMode = sandboxMode;
  }

  public VnPayProperties getVnpay() {
    return vnpay;
  }

  public VnPayProperties vnPay() {
    return vnpay;
  }

  public MomoProperties getMomo() {
    return momo;
  }

  public boolean getSandboxMode() {
    return sandboxMode;
  }

  public record VnPayProperties(
      String tmnCode,
      String hashSecret,
      String payUrl,
      String returnUrl,
      String version,
      String command,
      String currCode) {

    public VnPayProperties() {
      this("AURA_VNPAY_TMN_DEMO", "AURA_VNPAY_HASH_SECRET_KEY_DEMO_2026",
          "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
          "http://localhost:5173/billing/vnpay-return",
          "2.1.0", "pay", "VND");
    }

    public String getTmnCode() {
      return tmnCode != null ? tmnCode : "AURA_VNPAY_TMN_DEMO";
    }

    public String getHashSecret() {
      return hashSecret != null ? hashSecret : "AURA_VNPAY_HASH_SECRET_KEY_DEMO_2026";
    }

    public String getPayUrl() {
      return payUrl != null ? payUrl : "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    }

    public String getReturnUrl() {
      return returnUrl != null ? returnUrl : "http://localhost:5173/billing/vnpay-return";
    }

    public String getVersion() {
      return version != null ? version : "2.1.0";
    }

    public String getCommand() {
      return command != null ? command : "pay";
    }

    public String getCurrCode() {
      return currCode != null ? currCode : "VND";
    }
  }

  public record MomoProperties(
      String partnerCode,
      String accessKey,
      String secretKey,
      String endpoint,
      String returnUrl,
      String notifyUrl,
      String requestType) {

    public MomoProperties() {
      this("MOMO_AURA_MERCHANT_2026", "MOMO_ACCESS_KEY_AURA_DEMO",
          "MOMO_SECRET_KEY_AURA_DEMO_2026",
          "https://test-payment.momo.vn/v2/gateway/api/create",
          "http://localhost:5173/billing/momo-return",
          "http://localhost:8081/api/v1/billing/momo-ipn",
          "captureWallet");
    }

    public String getPartnerCode() {
      return partnerCode != null ? partnerCode : "MOMO_AURA_MERCHANT_2026";
    }

    public String getAccessKey() {
      return accessKey != null ? accessKey : "MOMO_ACCESS_KEY_AURA_DEMO";
    }

    public String getSecretKey() {
      return secretKey != null ? secretKey : "MOMO_SECRET_KEY_AURA_DEMO_2026";
    }

    public String getEndpoint() {
      return endpoint != null ? endpoint : "https://test-payment.momo.vn/v2/gateway/api/create";
    }

    public String getReturnUrl() {
      return returnUrl != null ? returnUrl : "http://localhost:5173/billing/momo-return";
    }

    public String getNotifyUrl() {
      return notifyUrl != null ? notifyUrl : "http://localhost:8081/api/v1/billing/momo-ipn";
    }

    public String getRequestType() {
      return requestType != null ? requestType : "captureWallet";
    }
  }
}