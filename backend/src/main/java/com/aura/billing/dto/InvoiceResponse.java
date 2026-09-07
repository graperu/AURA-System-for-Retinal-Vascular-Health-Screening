package com.aura.billing.dto;

public record InvoiceResponse(
        String invoiceNumber,
        Long paymentId,
        Long servicePackageId,
        String servicePackageName,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String provider,
        String providerReference,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime paidAt) {}