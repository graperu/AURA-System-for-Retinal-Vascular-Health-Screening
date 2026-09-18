package com.aura.billing.controller;

import com.aura.billing.config.PaymentGatewayProperties;
import com.aura.billing.dto.BankTransferIpnRequest;
import com.aura.billing.dto.MomoIpnRequest;
import com.aura.billing.service.AuraPaymentGatewayProvider;
import com.aura.billing.service.BillingService;
import com.aura.common.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Controller xử lý IPN (Instant Payment Notification) và Webhook từ các cổng thanh toán (FR-11, FR-28):
 * - VNPay IPN: Xác thực HMAC-SHA512 checksum, xử lý mã phản hồi vnp_ResponseCode.
 * - MoMo IPN: Xác thực HMAC-SHA256 signature, xử lý resultCode.
 * - Bank Transfer Webhook (VietQR / Casso / SeAPay): Xác thực chữ ký webhook, trích xuất mã chuyển khoản.
 */
@RestController
@RequestMapping("/api/v1/billing/ipn")
public class BillingWebhookController {

    private static final Logger log = LoggerFactory.getLogger(BillingWebhookController.class);
    private static final Pattern TRANSFER_CONTENT_PATTERN =
            Pattern.compile("(AURA\\s+NAP\\s+(?:\\d+\\s+KHAM\\s+[A-Za-z0-9]+|AURA_TXN_[A-Za-z0-9_]+|[A-Za-z0-9_]+))", Pattern.CASE_INSENSITIVE);

    private final BillingService billingService;
    private final PaymentGatewayProperties properties;

    public BillingWebhookController(BillingService billingService, PaymentGatewayProperties properties) {
        this.billingService = billingService;
        this.properties = properties != null ? properties : new PaymentGatewayProperties();
    }

    /**
     * Xử lý IPN từ VNPay qua HTTP GET.
     * Kiểm tra chữ ký HMAC-SHA512 trên tất cả param vnp_ (ngoại trừ vnp_SecureHash và vnp_SecureHashType).
     */
    @GetMapping("/vnpay")
    public ResponseEntity<Map<String, String>> handleVnPayIpn(@RequestParam Map<String, String> allParams) {
        log.info("VNPay IPN callback received: {}", allParams);

        String vnpSecureHash = allParams.get("vnp_SecureHash");
        if (vnpSecureHash == null || vnpSecureHash.isBlank()) {
            log.warn("VNPay IPN: Thiếu vnp_SecureHash");
            return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
        }

        // Lọc và sắp xếp các tham số vnp_ theo thứ tự alphabet
        Map<String, String> fields = new TreeMap<>();
        for (Map.Entry<String, String> entry : allParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key != null && key.startsWith("vnp_") && !key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) {
                if (value != null && !value.isEmpty()) {
                    fields.put(key, value);
                }
            }
        }

        // Tạo chuỗi hash data theo chuẩn VNPay
        StringBuilder hashData = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = fields.entrySet().iterator();
        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            hashData.append(entry.getKey()).append('=').append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            if (itr.hasNext()) {
                hashData.append('&');
            }
        }

        String calculatedHash = AuraPaymentGatewayProvider.hmacSha512(properties.getVnpay().getHashSecret(), hashData.toString());
        if (!constantTimeEqualsHex(calculatedHash, vnpSecureHash)) {
            log.error("VNPay IPN: Checksum không khớp! Calculated={}, Received={}", calculatedHash, vnpSecureHash);
            return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
        }

        String txnRef = allParams.get("vnp_TxnRef");
        String responseCode = allParams.get("vnp_ResponseCode");
        String transactionNo = allParams.get("vnp_TransactionNo");
        String amountStr = allParams.get("vnp_Amount");

        if (txnRef == null || txnRef.isBlank()) {
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
        }

        BigDecimal amount = null;
        if (amountStr != null && !amountStr.isBlank()) {
            try {
                amount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));
            } catch (Exception e) {
                log.warn("Không thể parse vnp_Amount: {}", amountStr);
            }
        }

        if ("00".equals(responseCode)) {
            try {
                billingService.processPaymentSuccess(txnRef, transactionNo, amount);
                log.info("VNPay IPN: Giao dịch {} xác nhận thành công.", txnRef);
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
            } catch (ResourceNotFoundException e) {
                log.warn("VNPay IPN: Không tìm thấy giao dịch {}", txnRef);
                return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
            } catch (Exception e) {
                log.error("VNPay IPN: Lỗi khi xử lý giao dịch {}: {}", txnRef, e.getMessage());
                return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error"));
            }
        } else {
            billingService.processPaymentFailure(txnRef, "VNPay response code: " + responseCode);
            log.info("VNPay IPN: Giao dịch {} thất bại với mã lỗi {}", txnRef, responseCode);
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        }
    }

    /**
     * Xử lý IPN từ MoMo qua HTTP POST.
     * Kiểm tra chữ ký HMAC-SHA256 chuẩn MoMo.
     */
    @PostMapping("/momo")
    public ResponseEntity<Map<String, Object>> handleMomoIpn(@RequestBody MomoIpnRequest req) {
        log.info("MoMo IPN callback received: {}", req);

        if (req.orderId() == null || req.signature() == null) {
            return ResponseEntity.badRequest().body(Map.of("resultCode", 99, "message", "Missing orderId or signature"));
        }

        String rawSignature = "accessKey=" + properties.getMomo().getAccessKey()
                + "&amount=" + (req.amount() != null ? req.amount() : 0L)
                + "&extraData=" + (req.extraData() != null ? req.extraData() : "")
                + "&message=" + (req.message() != null ? req.message() : "")
                + "&orderId=" + req.orderId()
                + "&orderInfo=" + (req.orderInfo() != null ? req.orderInfo() : "")
                + "&orderType=" + (req.orderType() != null ? req.orderType() : "")
                + "&partnerCode=" + (req.partnerCode() != null ? req.partnerCode() : "")
                + "&payType=" + (req.payType() != null ? req.payType() : "")
                + "&requestId=" + (req.requestId() != null ? req.requestId() : "")
                + "&responseTime=" + (req.responseTime() != null ? req.responseTime() : 0L)
                + "&resultCode=" + (req.resultCode() != null ? req.resultCode() : 0)
                + "&transId=" + (req.transId() != null ? req.transId() : 0L);

        String calculatedSignature = AuraPaymentGatewayProvider.hmacSha256(properties.getMomo().getSecretKey(), rawSignature);

        if (!constantTimeEqualsHex(calculatedSignature, req.signature())) {
            log.error("MoMo IPN: Chữ ký không hợp lệ! Calculated={}, Received={}", calculatedSignature, req.signature());
            return ResponseEntity.badRequest().body(Map.of(
                    "partnerCode", req.partnerCode() != null ? req.partnerCode() : "",
                    "orderId", req.orderId(),
                    "resultCode", 99,
                    "message", "Invalid signature"
            ));
        }

        if (req.resultCode() != null && req.resultCode() == 0) {
            BigDecimal amount = req.amount() != null ? BigDecimal.valueOf(req.amount()) : null;
            String gatewayTxnNo = req.transId() != null ? String.valueOf(req.transId()) : null;
            billingService.processPaymentSuccess(req.orderId(), gatewayTxnNo, amount);
            log.info("MoMo IPN: Giao dịch {} xác nhận thành công.", req.orderId());
            return ResponseEntity.ok(Map.of(
                    "partnerCode", req.partnerCode(),
                    "orderId", req.orderId(),
                    "resultCode", 0,
                    "message", "Success"
            ));
        } else {
            billingService.processPaymentFailure(req.orderId(), req.message() != null ? req.message() : "MoMo error code: " + req.resultCode());
            log.info("MoMo IPN: Giao dịch {} thất bại với resultCode {}", req.orderId(), req.resultCode());
            return ResponseEntity.ok(Map.of(
                    "partnerCode", req.partnerCode(),
                    "orderId", req.orderId(),
                    "resultCode", 0,
                    "message", "Acknowledge failure"
            ));
        }
    }

    /**
     * Xử lý Webhook chuyển khoản ngân hàng (VietQR / Casso / SeAPay).
     */
    @PostMapping("/bank-transfer")
    public ResponseEntity<Map<String, Object>> handleBankTransferWebhook(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String headerSecret,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String headerSignature,
            @RequestBody BankTransferIpnRequest req) {
        log.info("Bank Transfer webhook received: {}", req);

        String expectedSecret = properties.getWebhookSecret();
        if (expectedSecret == null || expectedSecret.isBlank()) {
            log.error("Bank Transfer webhook: Webhook secret chưa được cấu hình trên hệ thống");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Webhook secret not configured on server"
            ));
        }

        boolean authenticated = constantTimeEquals(expectedSecret, headerSecret)
                || constantTimeEquals(expectedSecret, headerSignature)
                || constantTimeEquals(expectedSecret, req.signature());

        if (!authenticated) {
            log.error("Bank Transfer webhook: Secret/Signature không hợp lệ");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Invalid webhook signature or secret"
            ));
        }

        String rawContent = req.content() != null ? req.content() : req.referenceCode();
        String transferContent = extractTransferContent(rawContent);

        if (transferContent == null || transferContent.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy nội dung chuyển khoản hợp lệ"
            ));
        }

        billingService.processPaymentSuccess(transferContent, req.transactionId(), req.amount());
        log.info("Bank Transfer webhook: Giao dịch với nội dung '{}' xác nhận thành công.", transferContent);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Bank transfer processed successfully"
        ));
    }

    /**
     * So sánh an toàn thời gian cố định (constant-time) cho Webhook Secret / Bearer Token.
     * Phân biệt chữ hoa / chữ thường (case-sensitive), so sánh trực tiếp bytes qua MessageDigest.isEqual.
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(aBytes, bBytes);
    }

    /**
     * So sánh an toàn thời gian cố định (constant-time) cho chuỗi hex checksum (VNPay, MoMo).
     * Không phân biệt hoa / thường (case-insensitive), chuẩn hóa toLowerCase(Locale.ROOT) trước khi so sánh.
     */
    private boolean constantTimeEqualsHex(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] aBytes = a.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(aBytes, bBytes);
    }

    private String extractTransferContent(String rawContent) {
        if (rawContent == null) return null;
        Matcher matcher = TRANSFER_CONTENT_PATTERN.matcher(rawContent);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return rawContent.trim();
    }
}
