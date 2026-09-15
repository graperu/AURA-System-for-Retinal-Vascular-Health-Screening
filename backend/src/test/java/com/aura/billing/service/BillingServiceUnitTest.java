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
    @DisplayName("Successfully initiates INDIVIDUAL package checkout with default payment gateway (VNPAY) in PENDING status, then succeeds upon IPN")
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

      PaymentTransactionResponse response = billingService.purchaseOrRenew(individualUserId, 1L);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(101L);
      assertThat(response.amount()).isEqualByComparingTo(BigDecimal.valueOf(100_000));
      assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
      assertThat(response.provider()).isEqualTo("VNPAY");
      assertThat(response.paymentUrl()).isEqualTo("https://sandbox.vnpayment.vn/pay");
      assertThat(response.transferContent()).isNotNull();
      assertThat(response.qrCodeUrl()).isNotNull();

      // Chưa có IPN: Tuyệt đối không cộng credits hoặc gửi thông báo
      verify(subscriptionRepository, never()).save(any(Subscription.class));
      verify(userNotificationService, never()).sendNotificationToUser(any(), any(), any(), any(), any(), any());

      // Khi có IPN gửi về xác nhận thành công
      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(101L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .provider("VNPAY")
          .providerReference("VNPAY-REF-001")
          .build();
      when(paymentTransactionRepository.findByProviderReference("VNPAY-REF-001"))
          .thenReturn(Optional.of(pendingTxn));
      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.empty());

      PaymentTransaction confirmed = billingService.processPaymentSuccess("VNPAY-REF-001", "VNP-TXN-001", BigDecimal.valueOf(100_000));
      assertThat(confirmed.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
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
    @DisplayName("Successfully purchases CLINIC package with custom payment method MOMO and renews existing subscription upon IPN")
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

      PaymentTransactionResponse response =
          billingService.purchaseOrRenew(clinicUserId, 2L, "MOMO");

      assertThat(response).isNotNull();
      assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
      assertThat(response.provider()).isEqualTo("MOMO");
      verify(subscriptionRepository, never()).save(any(Subscription.class));

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

      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(202L)
          .buyer(clinicUser)
          .servicePackage(clinicPackage)
          .amount(clinicPackage.getPrice())
          .status(PaymentStatus.PENDING)
          .provider("MOMO")
          .providerReference("MOMO-REF-999")
          .build();

      when(paymentTransactionRepository.findByProviderReference("MOMO-REF-999"))
          .thenReturn(Optional.of(pendingTxn));
      when(subscriptionRepository.findByOwnerIdAndServicePackageId(clinicUserId, 2L))
          .thenReturn(Optional.of(existingSub));
      when(subscriptionRepository.save(any(Subscription.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentTransaction confirmed = billingService.processPaymentSuccess("MOMO-REF-999", "MOMO-TXN-999", clinicPackage.getPrice());
      assertThat(confirmed.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
      assertThat(existingSub.getRemainingCredits()).isEqualTo(550);
      assertThat(existingSub.getExpiresAt()).isAfter(existingExpiry);
      assertThat(existingSub.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);

      verify(subscriptionRepository).save(existingSub);
    }

    @Test
    @DisplayName("Renewing expired subscription calculates new expiration from current time upon IPN success")
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

      PaymentTransactionResponse response = billingService.purchaseOrRenew(individualUserId, 1L, "VNPAY");
      assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);

      Subscription expiredSub =
          Subscription.builder()
              .id(60L)
              .owner(individualUser)
              .servicePackage(individualPackage)
              .remainingCredits(0)
              .expiresAt(LocalDateTime.now().minusDays(10))
              .status(SubscriptionStatus.EXPIRED)
              .build();

      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(303L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(individualPackage.getPrice())
          .status(PaymentStatus.PENDING)
          .provider("VNPAY")
          .providerReference("REF-RENEW")
          .build();

      when(paymentTransactionRepository.findByProviderReference("REF-RENEW"))
          .thenReturn(Optional.of(pendingTxn));
      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.of(expiredSub));
      when(subscriptionRepository.save(any(Subscription.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      billingService.processPaymentSuccess("REF-RENEW", "VNP-RENEW", individualPackage.getPrice());

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

      PaymentTransactionResponse response = billingService.purchaseOrRenew(individualUserId, 1L);
      assertThat(response).isNotNull();
      assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);

      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(404L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(individualPackage.getPrice())
          .status(PaymentStatus.PENDING)
          .provider("VNPAY")
          .providerReference("REF-NOTIF-FAIL")
          .build();

      when(paymentTransactionRepository.findByProviderReference("REF-NOTIF-FAIL"))
          .thenReturn(Optional.of(pendingTxn));
      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.empty());

      doThrow(new RuntimeException("SSE service unreachable"))
          .when(userNotificationService)
          .sendNotificationToUser(any(), anyString(), anyString(), anyString(), anyString(), anyString());

      PaymentTransaction confirmed = billingService.processPaymentSuccess("REF-NOTIF-FAIL", "VNP-404", individualPackage.getPrice());
      assertThat(confirmed.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
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

  @Nested
  @DisplayName("IPN Webhook & Payment Status Polling Tests")
  class IpnAndStatusTests {

    @Test
    @DisplayName("Idempotency: Khi IPN gửi lặp lại cho giao dịch đã SUCCEEDED, không cộng credit lần 2")
    void processPaymentSuccess_Idempotency_DoesNotGrantCreditsTwice() {
      PaymentTransaction succeededTxn = PaymentTransaction.builder()
          .id(777L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.SUCCEEDED)
          .provider("VNPAY")
          .providerReference("VNPAY_DUP_01")
          .build();

      when(paymentTransactionRepository.findByProviderReference("VNPAY_DUP_01"))
          .thenReturn(Optional.of(succeededTxn));

      PaymentTransaction result = billingService.processPaymentSuccess(
          "VNPAY_DUP_01", "GATEWAY-DUP", BigDecimal.valueOf(100_000));

      assertThat(result).isNotNull();
      assertThat(result.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
      // verify không gọi save subscription lần 2
      verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Fail-Closed: Khi số tiền trong IPN nhỏ hơn giá trị gói, giao dịch bị đánh dấu FAILED")
    void processPaymentSuccess_Underpayment_MarksFailed() {
      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(778L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .provider("VNPAY")
          .providerReference("VNPAY_UNDERPAY_01")
          .build();

      when(paymentTransactionRepository.findByProviderReference("VNPAY_UNDERPAY_01"))
          .thenReturn(Optional.of(pendingTxn));
      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      // Khách trả 50,000 VND trong khi gói 100,000 VND
      PaymentTransaction result = billingService.processPaymentSuccess(
          "VNPAY_UNDERPAY_01", "GATEWAY-UNDER", BigDecimal.valueOf(50_000));

      assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
      assertThat(result.getFailureReason()).contains("Số tiền thanh toán không hợp lệ");
      verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Fail-Closed: Khi số tiền trong IPN là null, giao dịch bị đánh dấu FAILED")
    void processPaymentSuccess_NullAmount_MarksFailed() {
      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(779L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .provider("VNPAY")
          .providerReference("VNPAY_NULL_AMOUNT_01")
          .build();

      when(paymentTransactionRepository.findByProviderReference("VNPAY_NULL_AMOUNT_01"))
          .thenReturn(Optional.of(pendingTxn));
      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentTransaction result = billingService.processPaymentSuccess(
          "VNPAY_NULL_AMOUNT_01", "GATEWAY-NULL", null);

      assertThat(result.getStatus()).isEqualTo(PaymentStatus.FAILED);
      assertThat(result.getFailureReason()).contains("Số tiền thanh toán không hợp lệ: Yêu cầu 100000 nhưng nhận NULL");
      verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("Chống IDOR: getTransactionStatus ném AccessDeniedException khi buyerId không khớp")
    void getTransactionStatus_IdorMismatch_ThrowsAccessDeniedException() {
      UUID strangerId = UUID.randomUUID();
      PaymentTransaction txn = PaymentTransaction.builder()
          .id(888L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .build();

      when(paymentTransactionRepository.findById(888L)).thenReturn(Optional.of(txn));

      assertThatThrownBy(() -> billingService.getTransactionStatus(strangerId, 888L))
          .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    @DisplayName("Fail-Closed: getTransactionStatus tự động chuyển PENDING thành EXPIRED nếu quá 15 phút")
    void getTransactionStatus_ExpiredPending_TransitionsToExpired() {
      PaymentTransaction expiredTxn = PaymentTransaction.builder()
          .id(889L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .expiresAt(LocalDateTime.now().minusMinutes(5)) // Đã quá hạn 5 phút
          .build();

      when(paymentTransactionRepository.findById(889L)).thenReturn(Optional.of(expiredTxn));
      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      var statusResponse = billingService.getTransactionStatus(individualUserId, 889L);

      assertThat(statusResponse).isNotNull();
      assertThat(statusResponse.status()).isEqualTo(PaymentStatus.EXPIRED);
      assertThat(statusResponse.failureReason()).contains("hết hạn thanh toán");
    }

    @Test
    @DisplayName("confirmLocalPayment: Kích hoạt thành công giao dịch cục bộ và cộng credits")
    void confirmLocalPayment_Pending_SucceedsAndGrantsCredits() {
      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(990L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .provider("VIETQR")
          .providerReference("VIETQR_REF_990")
          .transferContent("AURA NAP 1 KHAM TEST")
          .build();

      when(paymentTransactionRepository.findById(990L)).thenReturn(Optional.of(pendingTxn));
      when(paymentTransactionRepository.findByProviderReference("VIETQR_REF_990")).thenReturn(Optional.of(pendingTxn));
      when(paymentTransactionRepository.save(any(PaymentTransaction.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      when(subscriptionRepository.findByOwnerIdAndServicePackageId(individualUserId, 1L))
          .thenReturn(Optional.empty());
      when(subscriptionRepository.save(any(Subscription.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      PaymentTransaction confirmed = billingService.confirmLocalPayment(individualUserId, 990L);

      assertThat(confirmed).isNotNull();
      assertThat(confirmed.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
      assertThat(confirmed.getGatewayTransactionNo()).startsWith("LOCAL_TXN_");
      verify(subscriptionRepository, times(1)).save(any(Subscription.class));
      verify(userNotificationService, times(1)).sendNotificationToUser(
          eq(individualUserId), anyString(), anyString(), eq("BILLING"), eq("SUCCESS"), eq("/billing"));
    }

    @Test
    @DisplayName("confirmLocalPayment: Chống IDOR khi buyerId không khớp")
    void confirmLocalPayment_IdorMismatch_ThrowsAccessDeniedException() {
      UUID strangerId = UUID.randomUUID();
      PaymentTransaction pendingTxn = PaymentTransaction.builder()
          .id(991L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.PENDING)
          .build();

      when(paymentTransactionRepository.findById(991L)).thenReturn(Optional.of(pendingTxn));

      assertThatThrownBy(() -> billingService.confirmLocalPayment(strangerId, 991L))
          .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
      verify(subscriptionRepository, never()).save(any(Subscription.class));
    }

    @Test
    @DisplayName("confirmLocalPayment: Nếu giao dịch đã SUCCEEDED thì trả về ngay không cộng 2 lần")
    void confirmLocalPayment_AlreadySucceeded_Idempotent() {
      PaymentTransaction succeededTxn = PaymentTransaction.builder()
          .id(992L)
          .buyer(individualUser)
          .servicePackage(individualPackage)
          .amount(BigDecimal.valueOf(100_000))
          .status(PaymentStatus.SUCCEEDED)
          .build();

      when(paymentTransactionRepository.findById(992L)).thenReturn(Optional.of(succeededTxn));

      PaymentTransaction result = billingService.confirmLocalPayment(individualUserId, 992L);

      assertThat(result).isNotNull();
      assertThat(result.getStatus()).isEqualTo(PaymentStatus.SUCCEEDED);
      verify(subscriptionRepository, never()).save(any(Subscription.class));
    }
  }
}
