package com.aura.billing.dto;

import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** FR-12 / FR-28: one row of payment history. */
public record PaymentTransactionResponse(
        Long id,
        Long servicePackageId,
        String servicePackageName,
        BigDecimal amount,
        PaymentStatus status,
        String provider,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime paidAt) {

    public static PaymentTransactionResponse from(PaymentTransaction transaction) {
        return new PaymentTransactionResponse(
                transaction.getId(),
                transaction.getServicePackage().getId(),
                transaction.getServicePackage().getName(),
                transaction.getAmount(),
                transaction.getStatus(),
                transaction.getProvider(),
                transaction.getFailureReason(),
                transaction.getCreatedAt(),
                transaction.getPaidAt());
    }
}