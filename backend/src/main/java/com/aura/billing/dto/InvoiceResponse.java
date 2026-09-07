package com.aura.billing.dto;

import com.aura.billing.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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