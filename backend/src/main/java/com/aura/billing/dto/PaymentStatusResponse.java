package com.aura.billing.dto;

import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Polling DTO (FR-11, FR-28) to monitor the payment status of a transaction.
 */
public record PaymentStatusResponse(
        Long transactionId,
        String providerReference,
        PaymentStatus status,
        BigDecimal amount,
        Integer creditsAdded,
        LocalDateTime paidAt,
        LocalDateTime expiresAt,
        String failureReason) {

    public static PaymentStatusResponse from(PaymentTransaction transaction) {
        Integer credits = (transaction.getServicePackage() != null)
                ? transaction.getServicePackage().getCredits()
                : 0;
        return new PaymentStatusResponse(
                transaction.getId(),
                transaction.getProviderReference(),
                transaction.getStatus(),
                transaction.getAmount(),
                credits,
                transaction.getPaidAt(),
                transaction.getExpiresAt(),
                transaction.getFailureReason());
    }
}
