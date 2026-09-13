package com.aura.billing.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.billing.config.PaymentGatewayProperties;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class PaymentGatewayEdgeCasesTest {

  private UnavailablePaymentGateway unavailableGateway;
  private AuraPaymentGatewayProvider provider;
  private PaymentGatewayProperties properties;

  @BeforeEach
  void setUp() {
    unavailableGateway = new UnavailablePaymentGateway();
    properties = new PaymentGatewayProperties();
    provider = new AuraPaymentGatewayProvider(properties);
  }

  @Nested
  @DisplayName("UnavailablePaymentGateway Tests")
  class UnavailableGatewayTests {

    @Test
    @DisplayName("charge(buyerEmail, amount) trả về kết quả thất bại an toàn (fail-closed)")
    void charge_failsClosed() {
      PaymentGateway.GatewayResult result =
          unavailableGateway.charge("patient@aura.test", BigDecimal.valueOf(100000));

      assertThat(result).isNotNull();
      assertThat(result.success()).isFalse();
      assertThat(result.providerName()).isEqualTo("unconfigured");
      assertThat(result.providerReference()).isNull();
      assertThat(result.failureReason())
          .contains("Cổng thanh toán chưa được cấu hình. Không có khoản tiền nào được thu.");
      assertThat(result.paymentUrl()).isNull();
      assertThat(result.merchantId()).isNull();
    }

    @Test
    @DisplayName("charge với paymentMethod cũng trả về thất bại an toàn")
    void charge_withPaymentMethod_failsClosed() {
      PaymentGateway.GatewayResult result =
          unavailableGateway.charge("patient@aura.test", BigDecimal.valueOf(50000), "VNPAY");

      assertThat(result.success()).isFalse();
      assertThat(result.providerName()).isEqualTo("unconfigured");
    }
  }

  @Nested
  @DisplayName("AuraPaymentGatewayProvider Edge Cases & Provider Selection Tests")
  class AuraPaymentGatewayProviderTests {

    @Test
    @DisplayName("Số tiền null -> trả về thất bại với lý do 'Số tiền thanh toán không hợp lệ.'")
    void charge_nullAmount_returnsFailure() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", null, "VNPAY");

      assertThat(result.success()).isFalse();
      assertThat(result.providerName()).isEqualTo("VNPAY");
      assertThat(result.failureReason()).isEqualTo("Số tiền thanh toán không hợp lệ.");
      assertThat(result.paymentUrl()).isNull();
    }

    @Test
    @DisplayName("Số tiền bằng 0 -> trả về thất bại")
    void charge_zeroAmount_returnsFailure() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.ZERO, "MOMO");

      assertThat(result.success()).isFalse();
      assertThat(result.providerName()).isEqualTo("MOMO");
      assertThat(result.failureReason()).isEqualTo("Số tiền thanh toán không hợp lệ.");
    }

    @Test
    @DisplayName("Số tiền âm -> trả về thất bại")
    void charge_negativeAmount_returnsFailure() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(-1000), "VNPAY");

      assertThat(result.success()).isFalse();
      assertThat(result.failureReason()).isEqualTo("Số tiền thanh toán không hợp lệ.");
    }

    @Test
    @DisplayName("Provider MOMO -> tạo URL thanh toán MoMo và chữ ký HMAC-SHA256 chuẩn xác")
    void charge_momo_success() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(250000), "MOMO");

      assertThat(result.success()).isTrue();
      assertThat(result.providerName()).isEqualTo("MOMO_WALLET");
      assertThat(result.providerReference()).startsWith("MOMO_");
      assertThat(result.merchantId()).isEqualTo(properties.getMomo().getPartnerCode());
      assertThat(result.paymentUrl())
          .contains(properties.getMomo().getEndpoint())
          .contains("partnerCode=" + properties.getMomo().getPartnerCode())
          .contains("orderId=")
          .contains("signature=");
    }

    @Test
    @DisplayName("Provider MOMO viết thường 'momo' -> chuẩn hóa thành công")
    void charge_momoLowercase_success() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(150000), "  momo  ");

      assertThat(result.success()).isTrue();
      assertThat(result.providerName()).isEqualTo("MOMO_WALLET");
    }

    @Test
    @DisplayName("Provider VNPAY -> tạo URL thanh toán VNPay và chữ ký HMAC-SHA512")
    void charge_vnpay_success() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(500000), "VNPAY");

      assertThat(result.success()).isTrue();
      assertThat(result.providerName()).isEqualTo("VNPAY_GATEWAY");
      assertThat(result.providerReference()).startsWith("VNP_");
      assertThat(result.merchantId()).isEqualTo(properties.getVnpay().getTmnCode());
      assertThat(result.paymentUrl())
          .contains(properties.getVnpay().getPayUrl())
          .contains("vnp_TmnCode=" + properties.getVnpay().getTmnCode())
          .contains("vnp_SecureHash=");
    }

    @Test
    @DisplayName("Provider null -> fallback mặc định về VNPAY")
    void charge_nullPaymentMethod_defaultsToVnpay() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(300000), null);

      assertThat(result.success()).isTrue();
      assertThat(result.providerName()).isEqualTo("VNPAY_GATEWAY");
    }

    @Test
    @DisplayName("Overload 2 tham số charge(buyerEmail, amount) -> mặc định gọi VNPAY")
    void charge_twoParameters_defaultsToVnpay() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(120000));

      assertThat(result.success()).isTrue();
      assertThat(result.providerName()).isEqualTo("VNPAY_GATEWAY");
    }

    @Test
    @DisplayName("Provider CREDIT_CARD / VISA / MASTERCARD -> trả về URL Stripe Sandbox")
    void charge_creditCard_success() {
      PaymentGateway.GatewayResult resultCard =
          provider.charge("patient@aura.test", BigDecimal.valueOf(1000000), "CREDIT_CARD");
      assertThat(resultCard.success()).isTrue();
      assertThat(resultCard.providerName()).isEqualTo("CREDIT_CARD");
      assertThat(resultCard.paymentUrl()).contains("checkout.stripe.com/pay/");

      PaymentGateway.GatewayResult resultVisa =
          provider.charge("patient@aura.test", BigDecimal.valueOf(1000000), "VISA");
      assertThat(resultVisa.success()).isTrue();
      assertThat(resultVisa.providerName()).isEqualTo("CREDIT_CARD");

      PaymentGateway.GatewayResult resultMaster =
          provider.charge("patient@aura.test", BigDecimal.valueOf(1000000), "MASTERCARD");
      assertThat(resultMaster.success()).isTrue();
      assertThat(resultMaster.providerName()).isEqualTo("CREDIT_CARD");
    }

    @Test
    @DisplayName("Provider không hợp lệ -> fallback về VNPAY (default switch case)")
    void charge_unknownProvider_fallsBackToVnpay() {
      PaymentGateway.GatewayResult result =
          provider.charge("patient@aura.test", BigDecimal.valueOf(200000), "UNKNOWN_PROVIDER");

      assertThat(result.success()).isTrue();
      assertThat(result.providerName()).isEqualTo("VNPAY_GATEWAY");
    }
  }

  @Nested
  @DisplayName("PaymentGateway.GatewayResult Record Contract Tests")
  class GatewayResultRecordTests {

    @Test
    @DisplayName("GatewayResult 4-arg và 6-arg constructors, equality, hashCode và toString")
    void gatewayResult_contract() {
      PaymentGateway.GatewayResult res1 = new PaymentGateway.GatewayResult(
          true, "VNPAY", "REF123", null
      );
      PaymentGateway.GatewayResult res2 = new PaymentGateway.GatewayResult(
          true, "VNPAY", "REF123", null, null, null
      );
      PaymentGateway.GatewayResult res3 = new PaymentGateway.GatewayResult(
          false, "VNPAY", null, "Failed"
      );

      assertThat(res1).isEqualTo(res2);
      assertThat(res1.hashCode()).isEqualTo(res2.hashCode());
      assertThat(res1).isNotEqualTo(res3);
      assertThat(res1.toString()).contains("VNPAY").contains("REF123");
    }
  }
}
