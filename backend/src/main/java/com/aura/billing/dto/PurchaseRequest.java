package com.aura.billing.dto;

public record PurchaseRequest(String paymentMethod, String voucherCode,String simulateOutcome) {
    
}
