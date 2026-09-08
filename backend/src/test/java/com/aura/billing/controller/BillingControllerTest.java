package com.aura.billing.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.SubscriptionStatus;
import com.aura.billing.service.BillingService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class BillingControllerTest {

  @Mock
  private BillingService billingService;

  private BillingController controller;

  private AuraUserPrincipal userPrincipal;
  private UUID userId;

  @BeforeEach
  void setUp() {
    controller = new BillingController(billingService);
    userId = UUID.randomUUID();
    userPrincipal = new AuraUserPrincipal(userId, "patient@aura.com", "pass", true, List.of("USER"));
  }

  @Test
  @DisplayName("FR-11: Mua gói cước thành công")
  void purchase_success() {
    PaymentTransactionResponse res = new PaymentTransactionResponse(
        1L, 1L, "Gói Cơ Bản", BigDecimal.valueOf(50000), PaymentStatus.SUCCEEDED, "VNPAY", null, LocalDateTime.now(), LocalDateTime.now()
    );
    when(billingService.purchaseOrRenew(eq(userId), eq(1L), eq("VNPAY"))).thenReturn(res);

    ResponseEntity<ApiResponse<PaymentTransactionResponse>> response = controller.purchase(1L, "VNPAY", userPrincipal);

    assertNotNull(response.getBody());
    assertEquals(PaymentStatus.SUCCEEDED, response.getBody().data().status());
  }

  @Test
  @DisplayName("FR-12, FR-27: Lấy danh sách subscriptions và số dư lượt còn lại")
  void mySubscriptions_success() {
    SubscriptionResponse sub = new SubscriptionResponse(
        1L, "Gói Cá Nhân", 5, LocalDateTime.now().plusDays(30), SubscriptionStatus.ACTIVE
    );
    when(billingService.mySubscriptions(eq(userId))).thenReturn(List.of(sub));

    ApiResponse<List<SubscriptionResponse>> response = controller.mySubscriptions(userPrincipal);

    assertNotNull(response.data());
    assertEquals(1, response.data().size());
    assertEquals(5, response.data().get(0).remainingCredits());
  }

  @Test
  @DisplayName("FR-12: Lấy lịch sử giao dịch thanh toán")
  void myPayments_success() {
    PaymentTransactionResponse tx = new PaymentTransactionResponse(
        1L, 1L, "Gói Cơ Bản", BigDecimal.valueOf(50000), PaymentStatus.SUCCEEDED, "VNPAY", null, LocalDateTime.now(), LocalDateTime.now()
    );
    when(billingService.myPayments(eq(userId), any())).thenReturn(
        PageResponse.from(new PageImpl<>(List.of(tx), PageRequest.of(0, 20), 1))
    );

    ApiResponse<List<PaymentTransactionResponse>> response = controller.myPayments(userPrincipal, PageRequest.of(0, 20));

    assertNotNull(response.data());
    assertEquals(1, response.data().size());
  }
}
