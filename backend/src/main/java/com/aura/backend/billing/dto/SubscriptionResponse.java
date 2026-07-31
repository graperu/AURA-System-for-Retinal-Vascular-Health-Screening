package com.aura.backend.billing.dto;

import com.aura.backend.billing.entity.Subscription;
import com.aura.backend.billing.entity.SubscriptionStatus;

import java.time.LocalDateTime;

/** FR-12: "remaining analysis credits" for the current owner (user or clinic) and package. */
public record SubscriptionResponse(
        Long servicePackageId,
        String servicePackageName,
        Integer remainingCredits,
        LocalDateTime expiresAt,
        SubscriptionStatus status) {

    public static SubscriptionResponse from(Subscription subscription) {
        return new SubscriptionResponse(
                subscription.getServicePackage().getId(),
                subscription.getServicePackage().getName(),
                subscription.getRemainingCredits(),
                subscription.getExpiresAt(),
                subscription.getStatus());
    }
}
