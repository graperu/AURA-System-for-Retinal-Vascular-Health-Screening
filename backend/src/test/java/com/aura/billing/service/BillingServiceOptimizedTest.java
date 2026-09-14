package com.aura.billing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.ServicePackage;
import com.aura.billing.entity.Subscription;
import com.aura.billing.entity.SubscriptionStatus;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.billing.exception.ServicePackageNotFoundException;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.SubscriptionRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService - Optimized Failure Reason Fallback Tests")
class BillingServiceOptimizedTest {

  @Mock private ServicePackageService servicePackageService;
  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private PaymentTransactionRepository paymentTransactionRepository;
  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private PaymentGateway paymentGateway;
  @Mock private UserNotificationService userNotificationService;

  private BillingService billingService;
  private UUID ownerId;
  private User ownerUser;
  private ServicePackage servicePackage;

  private Role createRole(RoleName name) {
    Role role = new Role();
    ReflectionTestUtils.setField(role, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(role, "name", name);
    return role;
  }

  @BeforeEach
  void setUp() {
    billingService =
        new BillingService(
            servicePackageService,
            subscriptionRepository,
            paymentTransactionRepository,
            userRepository,
            userRoleRepository,
            paymentGateway,
            userNotificationService);

    ownerId = UUID.randomUUID();
    ownerUser = new User("buyer@aura.ai", "pass", "Buyer Alice");
    ReflectionTestUtils.setField(ownerUser, "id", ownerId);

    servicePackage =
        ServicePackage.builder()
            .id(100L)
            .name("Gói Sàng Lọc Cá Nhân")
            .price(BigDecimal.valueOf(200000))
            .credits(5)
            .validityDays(30)
            .active(true)
            .scope(PackageScope.INDIVIDUAL)
            .build();
  }

  @ParameterizedTest(name = "Failure Reason from gateway: \"{0}\"")
  @NullSource
  @ValueSource(strings = {"Thẻ không đủ số dư", "Hết hạn phiên thanh toán", "Ngân hàng bảo trì"})
  @DisplayName("purchaseOrRenew: Fallback thông báo lỗi 'Payment failed.' khi failureReason là null, hoặc dùng lý do cụ thể")
  void testPurchaseOrRenewFailureReasonFallback(String failureReason) {
    when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerUser));
    when(servicePackageService.findOrThrow(100L)).thenReturn(servicePackage);

    Role userRole = createRole(RoleName.USER);
    when(userRoleRepository.findAllByUserId(ownerId))
        .thenReturn(List.of(new UserRole(ownerUser, userRole)));

    when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
        .thenAnswer(i -> i.getArgument(0));

    PaymentGateway.GatewayResult failedResult =
        new PaymentGateway.GatewayResult(false, "VNPAY_GATEWAY", null, failureReason, null, null);
    when(paymentGateway.charge(ownerUser.getEmail(), servicePackage.getPrice(), "VNPAY"))
        .thenReturn(failedResult);

    String expectedExceptionMessage = failureReason != null ? failureReason : "Payment failed.";

    assertThatThrownBy(() -> billingService.purchaseOrRenew(ownerId, 100L, "VNPAY"))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessage(expectedExceptionMessage);

    ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
    verify(paymentTransactionRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());

    PaymentTransaction savedTransaction = captor.getValue();
    assertThat(savedTransaction.getStatus()).isEqualTo(PaymentStatus.FAILED);
    assertThat(savedTransaction.getFailureReason()).isEqualTo(failureReason);
  }

  @Test
  @DisplayName("purchaseOrRenew: Quá trình thanh toán khởi tạo PENDING với cổng VNPAY mặc định")
  void testPurchaseOrRenewSuccess() {
    when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerUser));
    when(servicePackageService.findOrThrow(100L)).thenReturn(servicePackage);

    Role userRole = createRole(RoleName.USER);
    when(userRoleRepository.findAllByUserId(ownerId))
        .thenReturn(List.of(new UserRole(ownerUser, userRole)));

    when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
        .thenAnswer(i -> {
          PaymentTransaction t = i.getArgument(0);
          ReflectionTestUtils.setField(t, "id", 999L);
          return t;
        });

    PaymentGateway.GatewayResult successResult =
        new PaymentGateway.GatewayResult(true, "VNPAY_GATEWAY", "TXN_REF_123", null, "http://pay.vnpay/123", "TMN_01");
    when(paymentGateway.charge(ownerUser.getEmail(), servicePackage.getPrice(), "VNPAY"))
        .thenReturn(successResult);

    var response = billingService.purchaseOrRenew(ownerId, 100L); // Overload không truyền paymentMethod

    assertThat(response).isNotNull();
    assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
    assertThat(response.provider()).isEqualTo("VNPAY_GATEWAY");

    verify(userNotificationService, never()).sendNotificationToUser(
        any(), any(), any(), any(), any(), any());
    verify(subscriptionRepository, never()).save(any());
  }

  @Test
  @DisplayName("deductCredit: Không có subscription nào -> trả về false")
  void testDeductCreditNoSubscriptionReturnsFalse() {
    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of());

    boolean deducted = billingService.deductCredit(ownerId);

    assertThat(deducted).isFalse();
    verify(subscriptionRepository, never()).save(any());
  }

  @Test
  @DisplayName("deductCredit: Có subscription nhưng đã hết hạn -> expireIfPast đổi status thành EXPIRED và trả về false")
  void testDeductCreditExpiredSubscriptionReturnsFalseAndExpires() {
    Subscription expiredSub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(5)
        .expiresAt(LocalDateTime.now().minusHours(2))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of(expiredSub));

    boolean deducted = billingService.deductCredit(ownerId);

    assertThat(deducted).isFalse();
    assertThat(expiredSub.getStatus()).isEqualTo(SubscriptionStatus.EXPIRED);
    verify(subscriptionRepository).save(expiredSub);
  }

  @Test
  @DisplayName("deductCredit: Có subscription còn hạn & credits > 0 -> trừ 1 lượt, lưu DB và trả về true")
  void testDeductCreditActiveSubscriptionSuccess() {
    Subscription activeSub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(3)
        .expiresAt(LocalDateTime.now().plusDays(15))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of(activeSub));

    boolean deducted = billingService.deductCredit(ownerId);

    assertThat(deducted).isTrue();
    assertThat(activeSub.getRemainingCredits()).isEqualTo(2);
    verify(subscriptionRepository).save(activeSub);
  }

  @Test
  @DisplayName("deductCredit: Có nhiều active subscriptions -> trừ vào subscription hết hạn sớm nhất")
  void testDeductCreditPicksEarliestExpiringSubscription() {
    Subscription laterSub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(5)
        .expiresAt(LocalDateTime.now().plusDays(30))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    Subscription earlierSub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(2)
        .expiresAt(LocalDateTime.now().plusDays(3))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of(laterSub, earlierSub));

    boolean deducted = billingService.deductCredit(ownerId);

    assertThat(deducted).isTrue();
    assertThat(earlierSub.getRemainingCredits()).isEqualTo(1);
    assertThat(laterSub.getRemainingCredits()).isEqualTo(5);
    verify(subscriptionRepository).save(earlierSub);
  }

  @Test
  @DisplayName("getRemainingCredits: Tính tổng lượt khám của tất cả subscription ACTIVE còn hạn")
  void testGetRemainingCreditsSumsActiveNonExpired() {
    Subscription sub1 = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(4)
        .expiresAt(LocalDateTime.now().plusDays(10))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    Subscription expiredSub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(10)
        .expiresAt(LocalDateTime.now().minusDays(1)) // Expired!
        .status(SubscriptionStatus.ACTIVE)
        .build();

    Subscription sub2 = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(6)
        .expiresAt(LocalDateTime.now().plusDays(20))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of(sub1, expiredSub, sub2));

    int remaining = billingService.getRemainingCredits(ownerId);

    assertThat(remaining).isEqualTo(10); // 4 + 6 (expiredSub excluded)
    assertThat(expiredSub.getStatus()).isEqualTo(SubscriptionStatus.EXPIRED);
  }

  @Test
  @DisplayName("purchaseOrRenew: Gói dịch vụ không tồn tại -> ném thẳng ServicePackageNotFoundException mà không tự ý fallback")
  void testPurchaseOrRenewNonExistentPackageThrowsDirectly() {
    Long nonExistentId = 999L;
    when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerUser));
    when(servicePackageService.findOrThrow(nonExistentId))
        .thenThrow(new ServicePackageNotFoundException(nonExistentId));

    assertThatThrownBy(() -> billingService.purchaseOrRenew(ownerId, nonExistentId, "VNPAY"))
        .isInstanceOf(ServicePackageNotFoundException.class)
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining(String.valueOf(nonExistentId));

    verify(servicePackageService, never()).browse(any());
    verify(paymentTransactionRepository, never()).save(any());
    verify(paymentGateway, never()).charge(any(), any(), any());
  }

  @Test
  @DisplayName("purchaseOrRenew: Gói dịch vụ không tồn tại với overload mặc định -> ném thẳng ServicePackageNotFoundException")
  void testPurchaseOrRenewNonExistentPackageDefaultMethodThrowsDirectly() {
    Long nonExistentId = 888L;
    when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerUser));
    when(servicePackageService.findOrThrow(nonExistentId))
        .thenThrow(new ServicePackageNotFoundException(nonExistentId));

    assertThatThrownBy(() -> billingService.purchaseOrRenew(ownerId, nonExistentId))
        .isInstanceOf(ServicePackageNotFoundException.class)
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining(String.valueOf(nonExistentId));

    verify(servicePackageService, never()).browse(any());
    verify(paymentTransactionRepository, never()).save(any());
    verify(paymentGateway, never()).charge(any(), any(), any());
  }

  @Test
  @DisplayName("deductCredit: Subscription ACTIVE nhưng remainingCredits = 0 -> không thể trừ và trả về false")
  void testDeductCreditActiveSubscriptionZeroCreditsReturnsFalse() {
    Subscription zeroCreditSub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(0)
        .expiresAt(LocalDateTime.now().plusDays(10))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of(zeroCreditSub));

    boolean deducted = billingService.deductCredit(ownerId);

    assertThat(deducted).isFalse();
    verify(subscriptionRepository, never()).save(any());
  }

  @Test
  @DisplayName("mySubscriptions: Lấy danh sách subscriptions của người dùng")
  void testMySubscriptions() {
    Subscription sub = Subscription.builder()
        .owner(ownerUser)
        .servicePackage(servicePackage)
        .remainingCredits(5)
        .expiresAt(LocalDateTime.now().plusDays(20))
        .status(SubscriptionStatus.ACTIVE)
        .build();

    when(subscriptionRepository.findByOwnerId(ownerId)).thenReturn(List.of(sub));

    var list = billingService.mySubscriptions(ownerId);
    assertThat(list).hasSize(1);
    assertThat(list.get(0).remainingCredits()).isEqualTo(5);
  }

  @Test
  @DisplayName("myPayments: Lấy lịch sử giao dịch thanh toán phân trang")
  void testMyPayments() {
    PaymentTransaction txn = PaymentTransaction.builder()
        .id(501L)
        .buyer(ownerUser)
        .servicePackage(servicePackage)
        .amount(BigDecimal.valueOf(200000))
        .status(PaymentStatus.SUCCEEDED)
        .provider("VNPAY")
        .build();

    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    org.springframework.data.domain.Page<PaymentTransaction> page = new org.springframework.data.domain.PageImpl<>(List.of(txn), pageable, 1);
    when(paymentTransactionRepository.findByBuyerIdOrderByCreatedAtDesc(ownerId, pageable)).thenReturn(page);

    var response = billingService.myPayments(ownerId, pageable);
    assertThat(response).isNotNull();
    assertThat(response.items()).hasSize(1);
    assertThat(response.items().get(0).amount()).isEqualByComparingTo(BigDecimal.valueOf(200000));
  }

  @Test
  @DisplayName("purchaseOrRenew: Gói không hoạt động (inactive) -> ném PackageInactiveException")
  void testPurchaseOrRenewInactivePackageThrows() {
    ServicePackage inactivePkg = ServicePackage.builder()
        .id(300L)
        .name("Gói Ngừng Cung Cấp")
        .price(BigDecimal.valueOf(100000))
        .credits(2)
        .validityDays(7)
        .active(false)
        .scope(PackageScope.INDIVIDUAL)
        .build();

    when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerUser));
    when(servicePackageService.findOrThrow(300L)).thenReturn(inactivePkg);

    assertThatThrownBy(() -> billingService.purchaseOrRenew(ownerId, 300L, "VNPAY"))
        .isInstanceOf(com.aura.billing.exception.PackageInactiveException.class);
  }

  @Test
  @DisplayName("purchaseOrRenew: Scope không khớp (User mua gói CLINIC) -> ném PackageScopeMismatchException")
  void testPurchaseOrRenewScopeMismatchThrows() {
    ServicePackage clinicPkg = ServicePackage.builder()
        .id(400L)
        .name("Gói Dành Riêng Phòng Khám")
        .price(BigDecimal.valueOf(5000000))
        .credits(500)
        .validityDays(365)
        .active(true)
        .scope(PackageScope.CLINIC)
        .build();

    when(userRepository.findById(ownerId)).thenReturn(Optional.of(ownerUser));
    when(servicePackageService.findOrThrow(400L)).thenReturn(clinicPkg);

    Role userRole = createRole(RoleName.USER);
    when(userRoleRepository.findAllByUserId(ownerId)).thenReturn(List.of(new UserRole(ownerUser, userRole)));

    assertThatThrownBy(() -> billingService.purchaseOrRenew(ownerId, 400L, "VNPAY"))
        .isInstanceOf(com.aura.billing.exception.PackageScopeMismatchException.class)
        .hasMessageContaining("chỉ dành cho tài khoản CLINIC");
  }

  @Test
  @DisplayName("processPaymentSuccess: Thông báo thất bại không làm gián đoạn giao dịch")
  void testPurchaseOrRenewNotificationExceptionIgnoredGracefully() {
    PaymentTransaction txn = PaymentTransaction.builder()
        .id(111L)
        .buyer(ownerUser)
        .servicePackage(servicePackage)
        .amount(servicePackage.getPrice())
        .status(PaymentStatus.PENDING)
        .provider("VNPAY")
        .providerReference("REF111")
        .build();

    when(paymentTransactionRepository.findByProviderReference("REF111"))
        .thenReturn(Optional.of(txn));
    when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
        .thenAnswer(i -> i.getArgument(0));

    when(subscriptionRepository.findByOwnerIdAndServicePackageId(ownerId, 100L))
        .thenReturn(Optional.empty());

    org.mockito.Mockito.doThrow(new RuntimeException("Notification server unreachable"))
        .when(userNotificationService).sendNotificationToUser(any(), any(), any(), any(), any(), any());

    var result = billingService.processPaymentSuccess("REF111", "GATEWAY-TXN-111", servicePackage.getPrice());
    assertThat(result).isNotNull();
    assertThat(result.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
    verify(subscriptionRepository).save(any());
  }
}
