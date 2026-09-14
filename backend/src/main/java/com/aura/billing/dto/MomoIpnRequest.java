package com.aura.billing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO for MoMo IPN (Instant Payment Notification) callback.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MomoIpnRequest(
        String partnerCode,
        String orderId,
        String requestId,
        Long amount,
        String orderInfo,
        String orderType,
        Long transId,
        Integer resultCode,
        String message,
        String payType,
        Long responseTime,
        String extraData,
        String signature) {}
