package com.aura.billing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

/**
 * DTO for Bank Transfer / VietQR webhook callbacks (e.g. VietQR, Casso, SeAPay).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record BankTransferIpnRequest(
        String gateway,
        String transactionId,
        String referenceCode,
        String content,
        BigDecimal amount,
        String accountNumber,
        String signature,
        String status) {}
