package com.aura.billing.service;

import com.aura.billing.config.PaymentGatewayProperties;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Triển khai khởi tạo phiên thanh toán đa kênh cho AURA (FR-11, FR-28):
 * - VNPay QR / Cổng VNPay ATM/Internet Banking (Sử dụng TMN Code & Hash Secret HMAC-SHA512)
 * - MoMo QR / Ví điện tử MoMo (Sử dụng Partner Code, Access Key, Secret Key HMAC-SHA256)
 * - VietQR Chuyển khoản ngân hàng 24/7 (Sử dụng Napas247 / VietQR Standard)
 * - Thẻ tín dụng quốc tế & Môi trường Thử nghiệm (Sandbox)
 *
 * LƯU Ý BẢO MẬT & KIẾN TRÚC:
 * Provider này CHỈ khởi tạo phiên thanh toán và tạo URL/QR code ở trạng thái PENDING.
 * Tuyệt đối không xác nhận hoàn tất giao dịch hoặc cộng credit tại đây.
 * Việc hoàn tất thanh toán bắt buộc phải thông qua xác thực Webhook / IPN có kiểm tra chữ ký số.
 */
@Component
@Primary
public class AuraPaymentGatewayProvider implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(AuraPaymentGatewayProvider.class);
    private static final DateTimeFormatter TXN_TIME_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final PaymentGatewayProperties properties;

    public AuraPaymentGatewayProvider(PaymentGatewayProperties properties) {
        this.properties = properties;
    }

    @Override
    public GatewayResult charge(String buyerEmail, BigDecimal amount) {
        return charge(buyerEmail, amount, "VNPAY");
    }

    @Override
    public GatewayResult charge(String buyerEmail, BigDecimal amount, String paymentMethod) {
        String method = paymentMethod != null ? paymentMethod.trim().toUpperCase() : "VNPAY";
        String timestamp = LocalDateTime.now().format(TXN_TIME_FMT);
        String randomSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return new GatewayResult(
                false,
                method,
                null,
                "Số tiền thanh toán không hợp lệ.",
                null,
                null
            );
        }

        switch (method) {
            case "MOMO": {
                var momo = properties.getMomo();
                String partnerCode = momo.getPartnerCode();
                String orderId = "MOMO_" + timestamp + "_" + randomSuffix;
                String requestId = "REQ_" + timestamp + "_" + randomSuffix;
                long amountInVnd = amount.longValue();

                // Tạo chữ ký HMAC-SHA256 chuẩn MoMo
                String rawSignature = "accessKey=" + momo.getAccessKey()
                        + "&amount=" + amountInVnd
                        + "&extraData="
                        + "&ipnUrl=" + momo.getNotifyUrl()
                        + "&orderId=" + orderId
                        + "&orderInfo=Thanh toan goi cuoc AURA - " + buyerEmail
                        + "&partnerCode=" + partnerCode
                        + "&redirectUrl=" + momo.getReturnUrl()
                        + "&requestId=" + requestId
                        + "&requestType=" + momo.getRequestType();

                String signature = hmacSha256(momo.getSecretKey(), rawSignature);

                String paymentUrl = momo.getEndpoint() + "?partnerCode=" + partnerCode
                        + "&orderId=" + orderId
                        + "&signature=" + signature;

                log.info("FR-11/FR-28: Khởi tạo phiên thanh toán MoMo PENDING [PartnerCode={}, OrderId={}]", partnerCode, orderId);

                return new GatewayResult(
                    true,
                    "MOMO_WALLET",
                    orderId,
                    null,
                    paymentUrl,
                    partnerCode
                );
            }

            case "VIETQR":
            case "BANK_TRANSFER": {
                var vietqr = properties.getVietqr();
                String providerRef = "AURA_TXN_" + timestamp + "_" + randomSuffix;
                String memo = "AURA NAP " + providerRef;
                String encodedMemo = URLEncoder.encode(memo, StandardCharsets.UTF_8);
                String encodedName = URLEncoder.encode(vietqr.getAccountName(), StandardCharsets.UTF_8);
                String qrUrl = String.format(
                        "https://img.vietqr.io/image/%s-%s-%s.png?amount=%d&addInfo=%s&accountName=%s",
                        vietqr.getBankId(),
                        vietqr.getAccountNo(),
                        vietqr.getTemplate(),
                        amount.longValue(),
                        encodedMemo,
                        encodedName
                );

                log.info("FR-11/FR-28: Khởi tạo phiên chuyển khoản VietQR PENDING [TxnRef={}]", providerRef);

                return new GatewayResult(
                    true,
                    "VIETQR",
                    providerRef,
                    null,
                    qrUrl,
                    vietqr.getAccountNo()
                );
            }

            case "CREDIT_CARD":
            case "VISA":
            case "MASTERCARD": {
                String providerRef = "CARD_" + timestamp + "_" + randomSuffix;
                log.info("FR-11/FR-28: Khởi tạo phiên thanh toán Credit Card PENDING [TxnRef={}]", providerRef);
                return new GatewayResult(
                    true,
                    "CREDIT_CARD",
                    providerRef,
                    null,
                    "https://checkout.stripe.com/pay/" + providerRef,
                    "AURA_STRIPE_MERCHANT"
                );
            }

            case "VNPAY":
            default: {
                var vnpay = properties.getVnpay();
                String tmnCode = vnpay.getTmnCode();
                String txnRef = "VNP_" + timestamp + "_" + randomSuffix;
                long amountInVnpay = amount.multiply(BigDecimal.valueOf(100)).longValue();

                Map<String, String> vnpParams = new TreeMap<>();
                vnpParams.put("vnp_Version", vnpay.getVersion());
                vnpParams.put("vnp_Command", vnpay.getCommand());
                vnpParams.put("vnp_TmnCode", tmnCode);
                vnpParams.put("vnp_Amount", String.valueOf(amountInVnpay));
                vnpParams.put("vnp_CurrCode", vnpay.getCurrCode());
                vnpParams.put("vnp_TxnRef", txnRef);
                vnpParams.put("vnp_OrderInfo", "Thanh toan goi cuoc AURA cho " + buyerEmail);
                vnpParams.put("vnp_OrderType", "other");
                vnpParams.put("vnp_Locale", "vn");
                vnpParams.put("vnp_ReturnUrl", vnpay.getReturnUrl());
                vnpParams.put("vnp_IpAddr", "127.0.0.1");
                vnpParams.put("vnp_CreateDate", timestamp);

                StringBuilder hashData = new StringBuilder();
                StringBuilder query = new StringBuilder();
                Iterator<Map.Entry<String, String>> itr = vnpParams.entrySet().iterator();
                while (itr.hasNext()) {
                    Map.Entry<String, String> entry = itr.next();
                    String key = entry.getKey();
                    String value = entry.getValue();
                    if (value != null && !value.isEmpty()) {
                        hashData.append(key).append('=').append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
                        query.append(URLEncoder.encode(key, StandardCharsets.US_ASCII)).append('=')
                             .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
                        if (itr.hasNext()) {
                            query.append('&');
                            hashData.append('&');
                        }
                    }
                }

                String secureHash = hmacSha512(vnpay.getHashSecret(), hashData.toString());
                String paymentUrl = vnpay.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;

                log.info("FR-11/FR-28: Khởi tạo phiên thanh toán VNPay PENDING [TmnCode={}, TxnRef={}]", tmnCode, txnRef);

                return new GatewayResult(
                    true,
                    "VNPAY_GATEWAY",
                    txnRef,
                    null,
                    paymentUrl,
                    tmnCode
                );
            }
        }
    }

    public static String hmacSha512(String key, String data) {
        try {
            Mac sha512Hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512Hmac.init(secretKey);
            byte[] hmacBytes = sha512Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * hmacBytes.length);
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Lỗi tạo HMAC-SHA512: {}", e.getMessage());
            return UUID.randomUUID().toString().replace("-", "");
        }
    }

    public static String hmacSha256(String key, String data) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hmacBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * hmacBytes.length);
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Lỗi tạo HMAC-SHA256: {}", e.getMessage());
            return UUID.randomUUID().toString().replace("-", "");
        }
    }
}
