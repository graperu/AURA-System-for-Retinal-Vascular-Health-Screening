package com.aura.billing.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.service.BillingService;
import com.aura.common.response.ApiResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        var result = billingService.purchaseOrRenew(principal.id(), packageId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mua/gia hạn gói thành công", result));
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
}