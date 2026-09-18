package com.aura.billing.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.aura.billing.config.PaymentGatewayProperties;
import com.aura.billing.dto.BankTransferIpnRequest;
import com.aura.billing.dto.MomoIpnRequest;
import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;
import com.aura.billing.service.AuraPaymentGatewayProvider;
import com.aura.billing.service.BillingService;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingWebhookController Unit Tests")
class BillingWebhookControllerTest {

  @Mock private BillingService billingService;

  private PaymentGatewayProperties properties;
  private BillingWebhookController controller;

  @BeforeEach
  void setUp() {
    properties = new PaymentGatewayProperties();
    controller = new BillingWebhookController(billingService, properties);
  }

  @Test
  @DisplayName("VNPay IPN: Checksum hợp lệ và responseCode '00' -> xác nhận thành công")
  void handleVnPayIpn_ValidChecksum_Success() {
    Map<String, String> params = new TreeMap<>();
    params.put("vnp_TmnCode", properties.getVnpay().getTmnCode());
    params.put("vnp_Amount", "10000000"); // 100,000 VND
    params.put("vnp_TxnRef", "VNP_TEST_123");
    params.put("vnp_ResponseCode", "00");
    params.put("vnp_TransactionNo", "TRANS_888");

    StringBuilder hashData = new StringBuilder();
    for (Map.Entry<String, String> entry : params.entrySet()) {
      hashData.append(entry.getKey()).append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII)).append('&');
    }
    if (hashData.length() > 0) {
      hashData.setLength(hashData.length() - 1);
    }

    String hash = AuraPaymentGatewayProvider.hmacSha512(properties.getVnpay().getHashSecret(), hashData.toString());

    Map<String, String> requestParams = new HashMap<>(params);
    requestParams.put("vnp_SecureHash", hash);

    when(billingService.processPaymentSuccess(eq("VNP_TEST_123"), eq("TRANS_888"), any(BigDecimal.class)))
        .thenReturn(PaymentTransaction.builder().status(PaymentStatus.SUCCEEDED).build());

    ResponseEntity<Map<String, String>> response = controller.handleVnPayIpn(requestParams);

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("RspCode")).isEqualTo("00");
    assertThat(response.getBody().get("Message")).isEqualTo("Confirm Success");
    verify(billingService).processPaymentSuccess(eq("VNP_TEST_123"), eq("TRANS_888"), any(BigDecimal.class));
  }

  @Test
  @DisplayName("VNPay IPN: Checksum giả mạo -> trả về lỗi 97 Invalid Checksum")
  void handleVnPayIpn_InvalidChecksum_ReturnsCode97() {
    Map<String, String> requestParams = new HashMap<>();
    requestParams.put("vnp_TxnRef", "VNP_TEST_HACK");
    requestParams.put("vnp_ResponseCode", "00");
    requestParams.put("vnp_SecureHash", "FAKE_FORGED_HASH");

    ResponseEntity<Map<String, String>> response = controller.handleVnPayIpn(requestParams);

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("RspCode")).isEqualTo("97");
    assertThat(response.getBody().get("Message")).isEqualTo("Invalid Checksum");
    verify(billingService, never()).processPaymentSuccess(any(), any(), any());
  }

  @Test
  @DisplayName("MoMo IPN: Chữ ký HMAC-SHA256 hợp lệ và resultCode 0 -> xác nhận thành công")
  void handleMomoIpn_ValidSignature_Success() {
    String orderId = "MOMO_ORDER_001";
    String requestId = "MOMO_REQ_001";
    Long amount = 150000L;
    Long transId = 9999999L;
    Integer resultCode = 0;
    String message = "Successful";
    String extraData = "";
    String orderInfo = "Thanh toan";
    String orderType = "momo_wallet";
    String partnerCode = properties.getMomo().getPartnerCode();
    String payType = "qr";
    Long responseTime = 1600000000L;

    String rawSig = "accessKey=" + properties.getMomo().getAccessKey()
        + "&amount=" + amount
        + "&extraData=" + extraData
        + "&message=" + message
        + "&orderId=" + orderId
        + "&orderInfo=" + orderInfo
        + "&orderType=" + orderType
        + "&partnerCode=" + partnerCode
        + "&payType=" + payType
        + "&requestId=" + requestId
        + "&responseTime=" + responseTime
        + "&resultCode=" + resultCode
        + "&transId=" + transId;

    String signature = AuraPaymentGatewayProvider.hmacSha256(properties.getMomo().getSecretKey(), rawSig);

    MomoIpnRequest req = new MomoIpnRequest(
        partnerCode, orderId, requestId, amount, orderInfo, orderType, transId,
        resultCode, message, payType, responseTime, extraData, signature
    );

    when(billingService.processPaymentSuccess(eq(orderId), eq(String.valueOf(transId)), any(BigDecimal.class)))
        .thenReturn(PaymentTransaction.builder().status(PaymentStatus.SUCCEEDED).build());

    ResponseEntity<Map<String, Object>> response = controller.handleMomoIpn(req);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("resultCode")).isEqualTo(0);
    verify(billingService).processPaymentSuccess(eq(orderId), eq(String.valueOf(transId)), any(BigDecimal.class));
  }

  @Test
  @DisplayName("MoMo IPN: Chữ ký không hợp lệ -> trả về 400 Bad Request")
  void handleMomoIpn_InvalidSignature_ReturnsBadRequest() {
    MomoIpnRequest req = new MomoIpnRequest(
        "MOMO", "ORDER_001", "REQ_001", 100000L, "info", "wallet", 123L,
        0, "ok", "qr", 12345L, "", "INVALID_SIGNATURE"
    );

    ResponseEntity<Map<String, Object>> response = controller.handleMomoIpn(req);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("resultCode")).isEqualTo(99);
    verify(billingService, never()).processPaymentSuccess(any(), any(), any());
  }

  @Test
  @DisplayName("Bank Transfer Webhook: Secret hợp lệ và trích xuất nội dung VietQR -> thành công")
  void handleBankTransferWebhook_ValidSecret_Success() {
    BankTransferIpnRequest req = new BankTransferIpnRequest(
        "VietQR", "BANK_TXN_555", null,
        "MBVCB.12345.AURA NAP 1 KHAM 9A8B7C.chuyen tien goi",
        BigDecimal.valueOf(100_000), "1208123456", null, "COMPLETED"
    );

    when(billingService.processPaymentSuccess(eq("AURA NAP 1 KHAM 9A8B7C"), eq("BANK_TXN_555"), eq(BigDecimal.valueOf(100_000))))
        .thenReturn(PaymentTransaction.builder().status(PaymentStatus.SUCCEEDED).build());

    ResponseEntity<Map<String, Object>> response = controller.handleBankTransferWebhook(
        properties.getWebhookSecret(), null, req
    );

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("success")).isEqualTo(true);
    verify(billingService).processPaymentSuccess(eq("AURA NAP 1 KHAM 9A8B7C"), eq("BANK_TXN_555"), eq(BigDecimal.valueOf(100_000)));
  }

  @Test
  @DisplayName("Bank Transfer Webhook: Secret sai -> trả về 401 UNAUTHORIZED")
  void handleBankTransferWebhook_InvalidSecret_ReturnsUnauthorized() {
    BankTransferIpnRequest req = new BankTransferIpnRequest(
        "VietQR", "BANK_TXN_555", null,
        "AURA NAP 1 KHAM 9A8B7C", BigDecimal.valueOf(100_000), "1208123456", null, "COMPLETED"
    );

    ResponseEntity<Map<String, Object>> response = controller.handleBankTransferWebhook(
        "WRONG_SECRET", null, req
    );

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    verify(billingService, never()).processPaymentSuccess(any(), any(), any());
  }

  @Test
  @DisplayName("Bank Transfer Webhook: expectedSecret chưa được cấu hình (null/blank) -> Fail-Closed trả về 500 INTERNAL_SERVER_ERROR")
  void handleBankTransferWebhook_UnconfiguredSecret_ReturnsInternalServerError() {
    PaymentGatewayProperties unconfiguredProperties = new PaymentGatewayProperties(
        properties.getVnpay(), properties.getMomo(), properties.getVietqr(), null, true
    );
    BillingWebhookController unconfiguredController = new BillingWebhookController(billingService, unconfiguredProperties);

    BankTransferIpnRequest req = new BankTransferIpnRequest(
        "VietQR", "BANK_TXN_555", null,
        "AURA NAP 1 KHAM 9A8B7C", BigDecimal.valueOf(100_000), "1208123456", null, "COMPLETED"
    );

    ResponseEntity<Map<String, Object>> response = unconfiguredController.handleBankTransferWebhook(
        "ANY_SECRET", null, req
    );

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("success")).isEqualTo(false);
    assertThat(response.getBody().get("message")).isEqualTo("Webhook secret not configured on server");
    verify(billingService, never()).processPaymentSuccess(any(), any(), any());
  }

  @Test
  @DisplayName("BE-BILL-2: Bank Transfer Webhook trích xuất chuẩn định dạng AURA NAP AURA_TXN_...")
  void handleBankTransferWebhook_AuraTxnPattern_Success() {
    BankTransferIpnRequest req = new BankTransferIpnRequest(
        "VietQR", "BANK_TXN_777", null,
        "FT2600123456.AURA NAP AURA_TXN_20260918_ABCD1234.Cam on quy khach",
        BigDecimal.valueOf(150_000), "1208123456", null, "COMPLETED"
    );

    when(billingService.processPaymentSuccess(eq("AURA NAP AURA_TXN_20260918_ABCD1234"), eq("BANK_TXN_777"), eq(BigDecimal.valueOf(150_000))))
        .thenReturn(PaymentTransaction.builder().status(PaymentStatus.SUCCEEDED).build());

    ResponseEntity<Map<String, Object>> response = controller.handleBankTransferWebhook(
        properties.getWebhookSecret(), null, req
    );

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().get("success")).isEqualTo(true);
    verify(billingService).processPaymentSuccess(eq("AURA NAP AURA_TXN_20260918_ABCD1234"), eq("BANK_TXN_777"), eq(BigDecimal.valueOf(150_000)));
  }
}

