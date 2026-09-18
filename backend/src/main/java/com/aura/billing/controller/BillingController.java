package com.aura.billing.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.billing.dto.PaymentStatusResponse;
import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.service.BillingService;
import com.aura.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/me")
@PreAuthorize("isAuthenticated()")
public class BillingController {

    private final BillingService billingService;
    private final boolean sandboxMode;
    private final Environment environment;

    @Autowired
    public BillingController(
            BillingService billingService,
            @Value("${payment.sandbox-mode:false}") boolean sandboxMode,
            @Autowired(required = false) Environment environment) {
        this.billingService = billingService;
        this.sandboxMode = sandboxMode;
        this.environment = environment;
    }

    public BillingController(BillingService billingService) {
        this(billingService, true, null);
    }

    @PostMapping({"/packages/{packageId}/checkout", "/packages/{packageId}/purchase"})
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> checkout(
            @PathVariable Long packageId,
            @RequestParam(required = false, defaultValue = "VNPAY") String paymentMethod,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        var result = billingService.initiateCheckout(principal.id(), packageId, paymentMethod);
        if (result == null) {
            result = billingService.purchaseOrRenew(principal.id(), packageId, paymentMethod);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo thanh toán thành công qua cổng " + (paymentMethod != null ? paymentMethod : "VNPAY"), result));
    }

    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> purchase(
            Long packageId,
            String paymentMethod,
            AuraUserPrincipal principal) {
        return checkout(packageId, paymentMethod, principal);
    }

    @GetMapping("/payments/{transactionId}/status")
    public ApiResponse<PaymentStatusResponse> getPaymentStatus(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        var status = billingService.getTransactionStatus(principal.id(), transactionId);
        return ApiResponse.success("Lấy trạng thái giao dịch thành công", status);
    }

    @PostMapping("/payments/{transactionId}/confirm-local")
    public ApiResponse<PaymentStatusResponse> confirmLocalPayment(
            @PathVariable Long transactionId,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        boolean isAdmin = principal != null && principal.roles() != null
                && (principal.roles().contains("ADMIN") || principal.roles().contains("ROLE_ADMIN"));
        boolean isDevOrTest = false;
        if (environment != null) {
            for (String profile : environment.getActiveProfiles()) {
                if ("dev".equalsIgnoreCase(profile) || "test".equalsIgnoreCase(profile)) {
                    isDevOrTest = true;
                    break;
                }
            }
        }
        if (!sandboxMode && !isDevOrTest && !isAdmin) {
            throw new AccessDeniedException(
                    "Xác nhận thanh toán cục bộ chỉ khả dụng trong môi trường thử nghiệm (Sandbox/Dev) hoặc bởi Quản trị viên.");
        }
        var txn = billingService.confirmLocalPayment(principal.id(), transactionId);
        return ApiResponse.success("Xác nhận thanh toán thành công", PaymentStatusResponse.from(txn));
    }

    @GetMapping("/subscriptions")
    public ApiResponse<List<SubscriptionResponse>> mySubscriptions(@AuthenticationPrincipal AuraUserPrincipal principal) {
        return ApiResponse.success("Lấy danh sách subscription thành công", billingService.mySubscriptions(principal.id()));
    }

    @GetMapping("/payments")
    public ApiResponse<List<PaymentTransactionResponse>> myPayments(
            @AuthenticationPrincipal AuraUserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success("Lấy lịch sử thanh toán thành công",
                billingService.myPayments(principal.id(), pageable).items());
    }

    @GetMapping("/credits")
    public ApiResponse<java.util.Map<String, Object>> myCredits(@AuthenticationPrincipal AuraUserPrincipal principal) {
        int remaining = billingService.getRemainingCredits(principal.id());
        return ApiResponse.success("Lấy số lượt phân tích khả dụng thành công", java.util.Map.of("remainingCredits", remaining));
    }
}
