package com.aura.billing.dto;

import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** FR-12 / FR-28: one row of payment history and gateway transaction details. */
public record PaymentTransactionResponse(
        Long id,
        Long servicePackageId,
        String servicePackageName,
        BigDecimal amount,
        PaymentStatus status,
        String provider,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        String providerReference,
        String paymentUrl,
        String merchantId) {

    public PaymentTransactionResponse(
            Long id,
            Long servicePackageId,
            String servicePackageName,
            BigDecimal amount,
            PaymentStatus status,
            String provider,
            String failureReason,
            LocalDateTime createdAt,
            LocalDateTime paidAt) {
        this(id, servicePackageId, servicePackageName, amount, status, provider, failureReason, createdAt, paidAt, null, null, null);
    }

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
                transaction.getPaidAt(),
                transaction.getProviderReference(),
                null,
                null);
    }

    public static PaymentTransactionResponse from(PaymentTransaction transaction, String paymentUrl, String merchantId) {
        return new PaymentTransactionResponse(
                transaction.getId(),
                transaction.getServicePackage().getId(),
                transaction.getServicePackage().getName(),
                transaction.getAmount(),
                transaction.getStatus(),
                transaction.getProvider(),
                transaction.getFailureReason(),
                transaction.getCreatedAt(),
                transaction.getPaidAt(),
                transaction.getProviderReference(),
                paymentUrl,
                merchantId);
    }
}
