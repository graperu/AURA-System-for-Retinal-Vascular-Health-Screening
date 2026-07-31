package com.aura.backend.billing.service;

import com.aura.backend.billing.entity.*;
import com.aura.backend.billing.exception.PackageInactiveException;
import com.aura.backend.billing.exception.PackageScopeMismatchException;
import com.aura.backend.billing.exception.PaymentFailedException;
import com.aura.backend.billing.repository.PaymentTransactionRepository;
import com.aura.backend.billing.repository.ServicePackageRepository;
import com.aura.backend.billing.repository.SubscriptionRepository;
import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import com.aura.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BillingServiceTest {

    private ServicePackageRepository servicePackageRepository;
    private SubscriptionRepository subscriptionRepository;
    private PaymentTransactionRepository paymentTransactionRepository;
    private UserRepository userRepository;
    private PaymentGateway paymentGateway;
    private BillingService billingService;

    @BeforeEach
    void setUp() {
        servicePackageRepository = mock(ServicePackageRepository.class);
        subscriptionRepository = mock(SubscriptionRepository.class);
        paymentTransactionRepository = mock(PaymentTransactionRepository.class);
        userRepository = mock(UserRepository.class);
        paymentGateway = mock(PaymentGateway.class);

        ServicePackageService servicePackageService = new ServicePackageService(servicePackageRepository);
        billingService = new BillingService(
                servicePackageService, subscriptionRepository, paymentTransactionRepository, userRepository, paymentGateway);

        when(paymentTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(subscriptionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void userCanPurchaseAnIndividualPackage() {
        User user = user(1L, Role.USER);
        ServicePackage pkg = servicePackage(10L, PackageScope.INDIVIDUAL, true, 5, 30);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(servicePackageRepository.findById(10L)).thenReturn(Optional.of(pkg));
        when(subscriptionRepository.findByOwnerIdAndServicePackageId(1L, 10L)).thenReturn(Optional.empty());
        when(paymentGateway.charge(anyString(), any()))
                .thenReturn(new PaymentGateway.GatewayResult(true, "mock", "REF-1", null));

        var response = billingService.purchaseOrRenew(1L, 10L);

        assertThat(response.status()).isEqualTo(PaymentStatus.SUCCEEDED);
    }

    @Test
    void userCannotPurchaseAClinicScopedPackage() {
        User user = user(1L, Role.USER);
        ServicePackage pkg = servicePackage(11L, PackageScope.CLINIC, true, 50, 30);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(servicePackageRepository.findById(11L)).thenReturn(Optional.of(pkg));

        assertThatThrownBy(() -> billingService.purchaseOrRenew(1L, 11L))
                .isInstanceOf(PackageScopeMismatchException.class);
    }

    @Test
    void cannotPurchaseAnInactivePackage() {
        User user = user(1L, Role.USER);
        ServicePackage pkg = servicePackage(12L, PackageScope.INDIVIDUAL, false, 5, 30);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(servicePackageRepository.findById(12L)).thenReturn(Optional.of(pkg));

        assertThatThrownBy(() -> billingService.purchaseOrRenew(1L, 12L))
                .isInstanceOf(PackageInactiveException.class);
    }

    @Test
    void failedChargeIsRecordedButGrantsNoCredits() {
        User user = user(1L, Role.USER);
        ServicePackage pkg = servicePackage(13L, PackageScope.INDIVIDUAL, true, 5, 30);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(servicePackageRepository.findById(13L)).thenReturn(Optional.of(pkg));
        when(paymentGateway.charge(anyString(), any()))
                .thenReturn(new PaymentGateway.GatewayResult(false, "mock", null, "card_declined"));

        assertThatThrownBy(() -> billingService.purchaseOrRenew(1L, 13L))
                .isInstanceOf(PaymentFailedException.class);

        org.mockito.Mockito.verify(subscriptionRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void renewingAStillActiveSubscriptionExtendsFromCurrentExpiryNotFromNow() {
        User user = user(1L, Role.USER);
        ServicePackage pkg = servicePackage(14L, PackageScope.INDIVIDUAL, true, 5, 30);
        LocalDateTime futureExpiry = LocalDateTime.now().plusDays(10);
        Subscription existing = Subscription.builder()
                .owner(user).servicePackage(pkg)
                .remainingCredits(2).expiresAt(futureExpiry).status(SubscriptionStatus.ACTIVE)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(servicePackageRepository.findById(14L)).thenReturn(Optional.of(pkg));
        when(subscriptionRepository.findByOwnerIdAndServicePackageId(1L, 14L)).thenReturn(Optional.of(existing));
        when(paymentGateway.charge(anyString(), any()))
                .thenReturn(new PaymentGateway.GatewayResult(true, "mock", "REF-2", null));

        billingService.purchaseOrRenew(1L, 14L);

        assertThat(existing.getRemainingCredits()).isEqualTo(7); // 2 leftover + 5 new
        assertThat(existing.getExpiresAt()).isEqualTo(futureExpiry.plusDays(30));
    }

    private User user(Long id, Role role) {
        return User.builder().id(id).email("owner" + id + "@example.com").role(role).provider(AuthProvider.LOCAL).enabled(true).build();
    }

    private ServicePackage servicePackage(Long id, PackageScope scope, boolean active, int credits, int validityDays) {
        return ServicePackage.builder()
                .id(id).name("Package " + id).scope(scope).active(active)
                .price(BigDecimal.valueOf(199000)).credits(credits).validityDays(validityDays)
                .build();
    }
}
