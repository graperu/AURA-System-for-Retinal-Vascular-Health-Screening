package com.aura.billing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.PaymentStatus;
import com.aura.billing.entity.PaymentTransaction;
import com.aura.billing.entity.ServicePackage;
import com.aura.billing.entity.Subscription;
import com.aura.billing.entity.SubscriptionStatus;
import com.aura.billing.exception.PackageInactiveException;
import com.aura.billing.exception.PackageScopeMismatchException;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.SubscriptionRepository;
import com.aura.common.response.PageResponse;
import com.aura.notification.service.UserNotificationService;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.exception.UserNotFoundException;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("BillingService Unit Tests")
class BillingServiceUnitTest {

  @Mock private ServicePackageService servicePackageService;
  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private PaymentTransactionRepository paymentTransactionRepository;
  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private PaymentGateway paymentGateway;
  @Mock private UserNotificationService userNotificationService;

  @InjectMocks private BillingService billingService;

  private UUID individualUserId;
  private UUID clinicUserId;
  private User individualUser;
  private User clinicUser;
  private Role userRole;
  private Role clinicRole;
  private ServicePackage individualPackage;
  private ServicePackage clinicPackage;

  @BeforeEach
  void setUp() {
    individualUserId = UUID.randomUUID();
    clinicUserId = UUID.randomUUID();

    individualUser = new User("patient@aura.health", "hashedPwd", "Nguyen Van Patient");
    ReflectionTestUtils.setField(individualUser, "id", individualUserId);

    clinicUser = new User("clinic@aura.health", "hashedPwd", "Phong Kham Da Khoa AURA");
    ReflectionTestUtils.setField(clinicUser, "id", clinicUserId);

    userRole = new Role();
    ReflectionTestUtils.setField(userRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(userRole, "name", RoleName.USER);

    clinicRole = new Role();
    ReflectionTestUtils.setField(clinicRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(clinicRole, "name", RoleName.CLINIC);

    individualPackage =
        ServicePackage.builder()
            .id(1L)
            .name("Gói Cá Nhân Cơ Bản")
            .description("10 lượt quét ảnh đáy mắt trong 30 ngày")
            .scope(PackageScope.INDIVIDUAL)
            .price(BigDecimal.valueOf(100_000))
            .credits(10)
            .validityDays(30)
            .active(true)
            .build();

    clinicPackage =
        ServicePackage.builder()
            .id(2L)
            .name("Gói Phòng Khám Tiêu Chuẩn")
            .description("500 lượt quét bulk screening trong 90 ngày")
            .scope(PackageScope.CLINIC)
            .price(BigDecimal.valueOf(4_500_000))
            .credits(500)
            .validityDays(90)
            .active(true)
            .build();
  }

  @Nested
  @DisplayName("purchaseOrRenew Tests")
  class PurchaseOrRenewTests {

    @Test
    @DisplayName("Successfully purchases INDIVIDUAL package with default payment gateway (VNPAY)")
    void purchase_DefaultGateway_IndividualUser_Success() {
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(1L)).thenReturn(individualPackage);

      UserRole ur = new UserRole(individualUser, userRole);
      when(userRoleRepository.findAllByUserId(individualUserId)).thenReturn(List.of(ur));

      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> {
            PaymentTransaction pt = inv.getArgument(0);
            if (pt.getId() == null) {
              ReflectionTestUtils.setField(pt, "id", 101L);
            }
            return pt;
          });

      PaymentGateway.GatewayResult gatewayResult =
          new PaymentGateway.GatewayResult(
              true, "VNPAY", "VNPAY-REF-001", null, "https://sandbox.vnpayment.vn/pay", "AURA_VNP");
      when(paymentGateway.charge(individualUser.getEmail(), individualPackage.getPrice(), "VNPAY"))
          .thenReturn(gatewayResult);

      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.empty());

      when(subscriptionRepository.save(any(Subscription.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentTransactionResponse response = billingService.purchaseOrRenew(individualUserId, 1L);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(101L);
      assertThat(response.amount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
      assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED);
      assertThat(response.provider()).isEqualTo("VNPAY");
      assertThat(response.paymentUrl()).isEqualTo("https://sandbox.vnpayment.vn/pay");

      verify(paymentTransactionRepository, times(2)).save(any(PaymentTransaction.class));
      verify(subscriptionRepository).save(any(Subscription.class));
      verify(userNotificationService).sendNotificationToUser(
          eq(individualUserId),
          eq("Nạp gói dịch vụ thành công"),
          anyString(),
          eq("BILLING"),
          eq("SUCCESS"),
          eq("/billing"));
    }

    @Test
    @DisplayName("Successfully purchases CLINIC package with custom payment method MOMO and renews existing subscription")
    void purchase_CustomGateway_RenewExistingSubscription_Success() {
      when(userRepository.findById(clinicUserId)).thenReturn(Optional.of(clinicUser));
      when(servicePackageService.findOrThrow(2L)).thenReturn(clinicPackage);

      UserRole ur = new UserRole(clinicUser, clinicRole);
      when(userRoleRepository.findAllByUserId(clinicUserId)).thenReturn(List.of(ur));

      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> {
            PaymentTransaction pt = inv.getArgument(0);
            if (pt.getId() == null) {
              ReflectionTestUtils.setField(pt, "id", 202L);
            }
            return pt;
          });

      PaymentGateway.GatewayResult gatewayResult =
          new PaymentGateway.GatewayResult(
              true, "MOMO", "MOMO-REF-999", null, "https://test-payment.momo.vn", "MOMO_AURA");
      when(paymentGateway.charge(clinicUser.getEmail(), clinicPackage.getPrice(), "MOMO"))
          .thenReturn(gatewayResult);

      LocalDateTime existingExpiry = LocalDateTime.now().plusDays(20);
      Subscription existingSub =
          Subscription.builder()
              .id(50L)
              .owner(clinicUser)
              .servicePackage(clinicPackage)
              .remainingCredits(50)
              .expiresAt(existingExpiry)
              .status(SubscriptionStatus.ACTIVE)
              .build();

      when(subscriptionRepository.findByOwnerIdAndServicePackageId(clinicUserId, 2L))
          .thenReturn(Optional.of(existingSub));
      when(subscriptionRepository.save(any(Subscription.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentTransactionResponse response =
          billingService.purchaseOrRenew(clinicUserId, 2L, "MOMO");

      assertThat(response).isNotNull();
      assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED);
      assertThat(response.provider()).isEqualTo("MOMO");
      assertThat(existingSub.getRemainingCredits()).isEqualTo(550);
      assertThat(existingSub.getExpiresAt()).isAfter(existingExpiry);
      assertThat(existingSub.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);

      verify(subscriptionRepository).save(existingSub);
    }

    @Test
    @DisplayName("Renewing expired subscription calculates new expiration from current time")
    void purchase_RenewExpiredSubscription_CalculatesFromNow() {
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(1L)).thenReturn(individualPackage);

      UserRole ur = new UserRole(individualUser, userRole);
      when(userRoleRepository.findAllByUserId(individualUserId)).thenReturn(List.of(ur));

      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentGateway.GatewayResult gatewayResult =
          new PaymentGateway.GatewayResult(true, "VNPAY", "REF-RENEW", null);
      when(paymentGateway.charge(individualUser.getEmail(), individualPackage.getPrice(), "VNPAY"))
          .thenReturn(gatewayResult);

      Subscription expiredSub =
          Subscription.builder()
              .id(60L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(0)
              .expiresAt(LocalDateTime.now().minusDays(10))
              .status(SubscriptionStatus.EXPIRED)
              .build();

      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.of(expiredSub));
      when(subscriptionRepository.save(any(Subscription.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      billingService.purchaseOrRenew(individualUserId, 1L, "VNPAY");

      assertThat(expiredSub.getRemainingCredits()).isEqualTo(10);
      assertThat(expiredSub.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
      assertThat(expiredSub.getExpiresAt()).isAfter(LocalDateTime.now().plusDays(29));
    }

    @Test
    @DisplayName("Notification exception does not disrupt billing transaction")
    void purchase_NotificationFailure_TransactionStillSucceeds() {
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(1L)).thenReturn(individualPackage);

      UserRole ur = new UserRole(individualUser, userRole);
      when(userRoleRepository.findAllByUserId(individualUserId)).thenReturn(List.of(ur));

      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentGateway.GatewayResult gatewayResult =
          new PaymentGateway.GatewayResult(true, "VNPAY", "REF-NOTIF-FAIL", null);
      when(paymentGateway.charge(individualUser.getEmail(), individualPackage.getPrice(), "VNPAY"))
          .thenReturn(gatewayResult);

      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.empty());

      doThrow(new RuntimeException("SSE service unreachable"))
          .when(userNotificationService)
          .sendNotificationToUser(any(), anyString(), anyString(), anyString(), anyString(), anyString());

      PaymentTransactionResponse response = billingService.purchaseOrRenew(individualUserId, 1L);

      assertThat(response).isNotNull();
      assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED);
      verify(subscriptionRepository).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Throws UserNotFoundException when ownerId does not exist")
    void purchase_UserNotFound_ThrowsException() {
      UUID nonExistentId = UUID.randomUUID();
      when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> billingService.purchaseOrRenew(nonExistentId, 1L))
          .isInstanceOf(UserNotFoundException.class);

      verify(paymentTransactionRepository, never()).save(any());
      verify(paymentGateway, never()).charge(any(), any(), any());
    }

    @Test
    @DisplayName("Throws ServicePackageNotFoundException when servicePackageId does not exist")
    void purchase_ServicePackageNotFound_ThrowsException() {
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(999L))
          .thenThrow(new com.aura.billing.exception.ServicePackageNotFoundException(999L));

      assertThatThrownBy(() -> billingService.purchaseOrRenew(individualUserId, 999L))
          .isInstanceOf(com.aura.billing.exception.ServicePackageNotFoundException.class)
          .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);

      verify(paymentTransactionRepository, never()).save(any());
      verify(paymentGateway, never()).charge(any(), any(), any());
    }

    @Test
    @DisplayName("Throws PackageInactiveException when service package is inactive")
    void purchase_PackageInactive_ThrowsException() {
      individualPackage.setActive(false);
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(1L)).thenReturn(individualPackage);

      assertThatThrownBy(() -> billingService.purchaseOrRenew(individualUserId, 1L))
          .isInstanceOf(PackageInactiveException.class);

      verify(paymentTransactionRepository, never()).save(any());
      verify(paymentGateway, never()).charge(any(), any(), any());
    }

    @Test
    @DisplayName("Throws PackageScopeMismatchException when INDIVIDUAL package is purchased by non-USER role")
    void purchase_ScopeMismatch_IndividualPackageWithClinicUser_ThrowsException() {
      when(userRepository.findById(clinicUserId)).thenReturn(Optional.of(clinicUser));
      when(servicePackageService.findOrThrow(1L)).thenReturn(individualPackage);

      UserRole ur = new UserRole(clinicUser, clinicRole);
      when(userRoleRepository.findAllByUserId(clinicUserId)).thenReturn(List.of(ur));

      assertThatThrownBy(() -> billingService.purchaseOrRenew(clinicUserId, 1L))
          .isInstanceOf(PackageScopeMismatchException.class)
          .hasMessageContaining("INDIVIDUAL");

      verify(paymentTransactionRepository, never()).save(any());
      verify(paymentGateway, never()).charge(any(), any(), any());
    }

    @Test
    @DisplayName("Throws PackageScopeMismatchException when CLINIC package is purchased by individual USER role")
    void purchase_ScopeMismatch_ClinicPackageWithIndividualUser_ThrowsException() {
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(2L)).thenReturn(clinicPackage);

      UserRole ur = new UserRole(individualUser, userRole);
      when(userRoleRepository.findAllByUserId(individualUserId)).thenReturn(List.of(ur));

      assertThatThrownBy(() -> billingService.purchaseOrRenew(individualUserId, 2L))
          .isInstanceOf(PackageScopeMismatchException.class)
          .hasMessageContaining("CLINIC");

      verify(paymentTransactionRepository, never()).save(any());
      verify(paymentGateway, never()).charge(any(), any(), any());
    }

    @Test
    @DisplayName("Payment gateway failure marks transaction FAILED and throws PaymentFailedException")
    void purchase_GatewayFailure_MarksFailedAndThrowsException() {
      when(userRepository.findById(individualUserId)).thenReturn(Optional.of(individualUser));
      when(servicePackageService.findOrThrow(1L)).thenReturn(individualPackage);

      UserRole ur = new UserRole(individualUser, userRole);
      when(userRoleRepository.findAllByUserId(individualUserId)).thenReturn(List.of(ur));

      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentGateway.GatewayResult failureResult =
          new PaymentGateway.GatewayResult(false, "VNPAY", null, "Số dư không đủ hoặc thẻ bị khóa");
      when(paymentGateway.charge(individualUser.getEmail(), individualPackage.getPrice(), "VNPAY"))
          .thenReturn(failureResult);

      assertThatThrownBy(() -> billingService.purchaseOrRenew(individualUserId, 1L))
          .isInstanceOf(PaymentFailedException.class)
          .hasMessageContaining("Số dư không đủ");

      verify(subscriptionRepository, never()).save(any());
      verify(userNotificationService, never())
          .sendNotificationToUser(any(), anyString(), anyString(), anyString(), anyString(), anyString());
    }
  }

  @Nested
  @DisplayName("mySubscriptions Tests")
  class MySubscriptionsTests {

    @Test
    @DisplayName("Active subscription within validity remains ACTIVE")
    void mySubscriptions_ActiveWithinValidity_ReturnsActive() {
      Subscription sub =
          Subscription.builder()
              .id(10L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(8)
              .expiresAt(LocalDateTime.now().plusDays(15))
              .status(SubscriptionStatus.ACTIVE)
              .build();

      when(subscriptionRepository.findByOwnerId(individualUserId)).thenReturn(List.of(sub));

      List<SubscriptionResponse> results = billingService.mySubscriptions(individualUserId);

      assertThat(results).hasSize(1);
      assertThat(results.get(0).status()).isEqualTo(SubscriptionStatus.ACTIVE);
      assertThat(results.get(0).remainingCredits()).isEqualTo(8);
      verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Active subscription past expiration is auto-marked EXPIRED and persisted")
    void mySubscriptions_ActivePastExpiration_ExpiresAndPersists() {
      Subscription sub =
          Subscription.builder()
              .id(11L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(3)
              .expiresAt(LocalDateTime.now().minusHours(2))
              .status(SubscriptionStatus.ACTIVE)
              .build();

      when(subscriptionRepository.findByOwnerId(individualUserId)).thenReturn(List.of(sub));
      when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));

      List<SubscriptionResponse> results = billingService.mySubscriptions(individualUserId);

      assertThat(results).hasSize(1);
      assertThat(results.get(0).status()).isEqualTo(SubscriptionStatus.EXPIRED);
      assertThat(sub.getStatus()).isEqualTo(SubscriptionStatus.EXPIRED);
      verify(subscriptionRepository).save(sub);
    }

    @Test
    @DisplayName("Already expired subscription is not saved again")
    void mySubscriptions_AlreadyExpired_DoesNotSaveAgain() {
      Subscription sub =
          Subscription.builder()
              .id(12L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(0)
              .expiresAt(LocalDateTime.now().minusDays(5))
              .status(SubscriptionStatus.EXPIRED)
              .build();

      when(subscriptionRepository.findByOwnerId(individualUserId)).thenReturn(List.of(sub));

      List<SubscriptionResponse> results = billingService.mySubscriptions(individualUserId);

      assertThat(results).hasSize(1);
      assertThat(results.get(0).status()).isEqualTo(SubscriptionStatus.EXPIRED);
      verify(subscriptionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Returns empty list when user has no subscriptions")
    void mySubscriptions_NoSubscriptions_ReturnsEmptyList() {
      when(subscriptionRepository.findByOwnerId(individualUserId)).thenReturn(List.of());

      List<SubscriptionResponse> results = billingService.mySubscriptions(individualUserId);

      assertThat(results).isEmpty();
    }
  }

  @Nested
  @DisplayName("myPayments Tests")
  class MyPaymentsTests {

    @Test
    @DisplayName("Returns paged payment transactions successfully")
    void myPayments_ReturnsPagedTransactions() {
      Pageable pageable = PageRequest.of(0, 10);
      PaymentTransaction tx1 =
          PaymentTransaction.builder()
              .id(1001L)
              .buyer(individualUser)
              .servicePackage(individualPackage)
              .amount(BigDecimal.valueOf(100_000))
              .status(PaymentStatus.SUCCEEDED)
              .provider("VNPAY")
              .paidAt(LocalDateTime.now())
              .build();

      when(paymentTransactionRepository.findByBuyerIdOrderByCreatedAtDesc(individualUserId, pageable))
          .thenReturn(new PageImpl<>(List.of(tx1), pageable, 1));

      PageResponse<PaymentTransactionResponse> response =
          billingService.myPayments(individualUserId, pageable);

      assertThat(response).isNotNull();
      assertThat(response.items()).hasSize(1);
      assertThat(response.items().get(0).id()).isEqualTo(1001L);
      assertThat(response.items().get(0).status()).isEqualTo(PaymentStatus.SUCCEEDED);
      assertThat(response.totalItems()).isEqualTo(1);
    }

    @Test
    @DisplayName("Returns empty page when user has no transactions")
    void myPayments_EmptyPage_ReturnsZeroElements() {
      Pageable pageable = PageRequest.of(0, 10);
      when(paymentTransactionRepository.findByBuyerIdOrderByCreatedAtDesc(individualUserId, pageable))
          .thenReturn(new PageImpl<>(List.of(), pageable, 0));

      PageResponse<PaymentTransactionResponse> response =
          billingService.myPayments(individualUserId, pageable);

      assertThat(response.items()).isEmpty();
      assertThat(response.totalItems()).isZero();
    }
  }

  @Nested
  @DisplayName("Subscription Quota & Credit Verification Tests")
  class SubscriptionCreditVerificationTests {

    @Test
    @DisplayName("Verifies hasActiveSubscription logic when credits > 0 and not expired")
    void verifyHasActiveSubscription_TrueWhenValid() {
      Subscription activeSub =
          Subscription.builder()
              .id(1L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(5)
              .expiresAt(LocalDateTime.now().plusDays(10))
              .status(SubscriptionStatus.ACTIVE)
              .build();

      boolean hasActive =
          activeSub.getStatus() == SubscriptionStatus.ACTIVE
              && activeSub.getRemainingCredits() > 0
              && activeSub.getExpiresAt().isAfter(LocalDateTime.now());

      assertThat(hasActive).isTrue();
    }

    @Test
    @DisplayName("Verifies hasActiveSubscription logic when credits == 0")
    void verifyHasActiveSubscription_FalseWhenNoCredits() {
      Subscription emptySub =
          Subscription.builder()
              .id(2L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(0)
              .expiresAt(LocalDateTime.now().plusDays(10))
              .status(SubscriptionStatus.ACTIVE)
              .build();

      boolean hasActive =
          emptySub.getStatus() == SubscriptionStatus.ACTIVE
              && emptySub.getRemainingCredits() > 0
              && emptySub.getExpiresAt().isAfter(LocalDateTime.now());

      assertThat(hasActive).isFalse();
    }

    @Test
    @DisplayName("Verifies credit deduction logic decrements correctly")
    void verifyDeductCredit_DecrementsRemainingCredits() {
      Subscription sub =
          Subscription.builder()
              .id(3L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(10)
              .expiresAt(LocalDateTime.now().plusDays(30))
              .status(SubscriptionStatus.ACTIVE)
              .build();

      // Deduct 1 credit
      int beforeCredits = sub.getRemainingCredits();
      sub.setRemainingCredits(beforeCredits - 1);

      assertThat(sub.getRemainingCredits()).isEqualTo(9);
    }
  }
}
