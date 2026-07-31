package com.aura.backend.billing.controller;

import com.aura.backend.auth.security.AuraUserPrincipal;
import com.aura.backend.billing.dto.PaymentTransactionResponse;
import com.aura.backend.billing.dto.SubscriptionResponse;
import com.aura.backend.billing.service.BillingService;
import com.aura.backend.common.response.ApiEnvelope;
import com.aura.backend.common.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Self-service billing for the currently logged-in account. Works the same whether the
 * caller is a USER (FR-11) or a CLINIC (FR-28) — BillingService checks the package's scope
 * against the caller's role, so there's one endpoint set instead of two near-duplicates.
 */
@RestController
@RequestMapping("/api/v1/me")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/packages/{packageId}/purchase")
    public ResponseEntity<ApiEnvelope<PaymentTransactionResponse>> purchase(
            @PathVariable Long packageId,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        var result = billingService.purchaseOrRenew(principal.getId(), packageId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiEnvelope.success(result));
    }

    /** FR-12: remaining analysis credits, per package ever purchased. */
    @GetMapping("/subscriptions")
    public ApiEnvelope<List<SubscriptionResponse>> mySubscriptions(@AuthenticationPrincipal AuraUserPrincipal principal) {
        return ApiEnvelope.success(billingService.mySubscriptions(principal.getId()));
    }

    /** FR-12: payment history. */
    @GetMapping("/payments")
    public ApiEnvelope<PageResponse<PaymentTransactionResponse>> myPayments(
            @AuthenticationPrincipal AuraUserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiEnvelope.success(billingService.myPayments(principal.getId(), pageable));
    }
}
