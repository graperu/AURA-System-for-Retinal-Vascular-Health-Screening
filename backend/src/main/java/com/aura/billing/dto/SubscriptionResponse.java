package com.aura.billing.dto;

import com.aura.billing.entity.Subscription;
import com.aura.billing.entity.SubscriptionStatus;

import java.time.LocalDateTime;

/** FR-12: "remaining analysis credits" for the current owner (user or clinic) and package. */
public record SubscriptionResponse(
        Long servicePackageId,
        String servicePackageName,
        Integer remainingCredits,
        LocalDateTime expiresAt,
        SubscriptionStatus status) {

    public static SubscriptionResponse from(Subscription subscription) {
        Long pkgId = null;
        String pkgName = "Gói dịch vụ AURA";
        try {
            if (subscription.getServicePackage() != null) {
                pkgId = subscription.getServicePackage().getId();
                pkgName = subscription.getServicePackage().getName();
            }
        } catch (Exception ignored) {
            // Lazy proxy safety fallback
        }
        return new SubscriptionResponse(
                pkgId,
                pkgName,
                subscription.getRemainingCredits(),
                subscription.getExpiresAt(),
                subscription.getStatus());
    }
}