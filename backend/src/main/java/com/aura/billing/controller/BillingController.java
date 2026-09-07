package com.aura.billing.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.billing.dto.CreditsResponse;
import com.aura.billing.dto.InvoiceResponse;
import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.PurchaseRequest;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.service.BillingService;
import com.aura.common.response.ApiResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/me")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/packages/{packageId}/purchase")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> purchase(
            @PathVariable Long packageId,
            @RequestBody(required = false) PurchaseRequest request,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        PurchaseRequest body = request != null
                ? request
                : new PurchaseRequest(null, null, null);
        PaymentTransactionResponse result =
                billingService.purchaseOrRenew(principal.id(), packageId, body);

        if (result.status() == PaymentStatus.PENDING) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(ApiResponse.success(
                            "Giao dịch đang chờ xác nhận (VietQR / cổng async)", result));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mua/gia hạn gói thành công", result));
    }

    @GetMapping("/subscriptions")
    public ApiResponse<List<SubscriptionResponse>> mySubscriptions(
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        return ApiResponse.success(
                "Lấy danh sách subscription thành công",
                billingService.mySubscriptions(principal.id()));
    }

    @GetMapping("/payments")
    public ApiResponse<List<PaymentTransactionResponse>> myPayments(
            @AuthenticationPrincipal AuraUserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(
                "Lấy lịch sử thanh toán thành công",
                billingService.myPayments(principal.id(), pageable).items());
    }

    @GetMapping("/credits")
    public ApiResponse<CreditsResponse> myCredits(
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        return ApiResponse.success(
                "Số credit còn lại", billingService.myCredits(principal.id()));
    }

    @PostMapping("/payments/{paymentId}/confirm")
    public ApiResponse<PaymentTransactionResponse> confirmPayment(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        return ApiResponse.success(
                "Đã xác nhận thanh toán — credit đã cộng",
                billingService.confirmPayment(principal.id(), paymentId));
    }

    @PostMapping("/payments/{paymentId}/fail")
    public ApiResponse<PaymentTransactionResponse> failPayment(
            @PathVariable Long paymentId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.success(
                "Đã đánh dấu giao dịch thất bại",
                billingService.failPayment(principal.id(), paymentId, reason));
    }

    @PostMapping("/payments/{paymentId}/refund")
    public ApiResponse<PaymentTransactionResponse> refund(
            @PathVariable Long paymentId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.success(
                "Đã hoàn tiền và trừ credit tương ứng",
                billingService.refund(principal.id(), paymentId, reason));
    }

    @GetMapping("/payments/{paymentId}/invoice")
    public ApiResponse<InvoiceResponse> invoice(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        return ApiResponse.success(
                "Hóa đơn", billingService.invoice(principal.id(), paymentId));
    }

    @PatchMapping("/subscriptions/{subscriptionId}/auto-renew")
    public ApiResponse<Map<String, Object>> setAutoRenew(
            @PathVariable Long subscriptionId,
            @RequestBody(required = false) Map<String, Boolean> body,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        boolean enabled = body != null && Boolean.TRUE.equals(body.get("enabled"));
        return ApiResponse.success(
                enabled
                        ? "Đã bật tự động gia hạn (sẽ áp dụng khi scheduler sẵn sàng)"
                        : "Đã tắt tự động gia hạn",
                Map.of("subscriptionId", subscriptionId, "autoRenew", enabled));
    }
}