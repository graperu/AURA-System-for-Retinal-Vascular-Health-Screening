package com.aura.billing.service;

import java.math.BigDecimal;
import org.springframework.stereotype.Component;

/** Safe default: fail closed until an external payment provider is configured. */
@Component
public class UnavailablePaymentGateway implements PaymentGateway {

    @Override
    public GatewayResult charge(String buyerEmail, BigDecimal amount) {
        return new GatewayResult(
                false,
                "unconfigured",
                null,
                "Cổng thanh toán chưa được cấu hình. Không có khoản tiền nào được thu.");
    }
}
