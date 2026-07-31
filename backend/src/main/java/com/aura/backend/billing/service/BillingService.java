package com.aura.backend.billing.service;

import com.aura.backend.billing.dto.PaymentTransactionResponse;
import com.aura.backend.billing.dto.SubscriptionResponse;
import com.aura.backend.billing.entity.*;
import com.aura.backend.billing.exception.PackageInactiveException;
import com.aura.backend.billing.exception.PackageScopeMismatchException;
import com.aura.backend.billing.exception.PaymentFailedException;
import com.aura.backend.billing.repository.PaymentTransactionRepository;
import com.aura.backend.billing.repository.SubscriptionRepository;
import com.aura.backend.common.response.PageResponse;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import com.aura.backend.user.exception.UserNotFoundException;
import com.aura.backend.user.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * FR-11 (user purchase/renew), FR-28 (clinic purchase/renew), FR-12 (payment history +
 * remaining credits). One code path handles both FR-11 and FR-28: the caller's Role decides
 * which PackageScope they're allowed to buy, so there's no separate "clinic billing service"
 * duplicating the same renewal math.
 */
@Service
public class BillingService {

    private final ServicePackageService servicePackageService;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final PaymentGateway paymentGateway;

    public BillingService(ServicePackageService servicePackageService,
                           SubscriptionRepository subscriptionRepository,
                           PaymentTransactionRepository paymentTransactionRepository,
                           UserRepository userRepository,
                           PaymentGateway paymentGateway) {
        this.servicePackageService = servicePackageService;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.userRepository = userRepository;
        this.paymentGateway = paymentGateway;
    }

    @Transactional
    public PaymentTransactionResponse purchaseOrRenew(Long ownerId, Long servicePackageId) {
        User owner = userRepository.findById(ownerId).orElseThrow(() -> new UserNotFoundException(ownerId));
        ServicePackage servicePackage = servicePackageService.findOrThrow(servicePackageId);

        if (!servicePackage.isActive()) {
            throw new PackageInactiveException(servicePackageId);
        }
        assertScopeMatches(owner, servicePackage);

        PaymentTransaction transaction = paymentTransactionRepository.save(PaymentTransaction.builder()
                .buyer(owner)
                .servicePackage(servicePackage)
                .amount(servicePackage.getPrice())
                .status(PaymentStatus.PENDING)
                .provider("mock")
                .build());

        PaymentGateway.GatewayResult result = paymentGateway.charge(owner.getEmail(), servicePackage.getPrice());

        if (!result.success()) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason(result.failureReason());
            paymentTransactionRepository.save(transaction);
            throw new PaymentFailedException(result.failureReason() != null ? result.failureReason() : "Payment failed.");
        }

        transaction.setStatus(PaymentStatus.SUCCEEDED);
        transaction.setProviderReference(result.providerReference());
        transaction.setPaidAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        grantOrExtendCredits(owner, servicePackage);

        return PaymentTransactionResponse.from(transaction);
    }

    private void assertScopeMatches(User owner, ServicePackage servicePackage) {
        boolean matches = switch (servicePackage.getScope()) {
            case INDIVIDUAL -> owner.getRole() == Role.USER;
            case CLINIC -> owner.getRole() == Role.CLINIC;
        };
        if (!matches) {
            throw new PackageScopeMismatchException(
                    "Package '" + servicePackage.getName() + "' is only available to " + servicePackage.getScope() + " accounts.");
        }
    }

    private void grantOrExtendCredits(User owner, ServicePackage servicePackage) {
        Subscription subscription = subscriptionRepository
                .findByOwnerIdAndServicePackageId(owner.getId(), servicePackage.getId())
                .orElseGet(() -> Subscription.builder()
                        .owner(owner)
                        .servicePackage(servicePackage)
                        .remainingCredits(0)
                        .expiresAt(LocalDateTime.now())
                        .status(SubscriptionStatus.ACTIVE)
                        .build());

        LocalDateTime renewalBase = subscription.getExpiresAt().isAfter(LocalDateTime.now())
                ? subscription.getExpiresAt()
                : LocalDateTime.now();

        subscription.setRemainingCredits(subscription.getRemainingCredits() + servicePackage.getCredits());
        subscription.setExpiresAt(renewalBase.plusDays(servicePackage.getValidityDays()));
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(subscription);
    }

    /** FR-12: remaining analysis credits, one entry per package the owner has ever bought. */
    public List<SubscriptionResponse> mySubscriptions(Long ownerId) {
        return subscriptionRepository.findByOwnerId(ownerId).stream()
                .map(this::expireIfPast)
                .map(SubscriptionResponse::from)
                .toList();
    }

    /** FR-12: payment history. */
    public PageResponse<PaymentTransactionResponse> myPayments(Long ownerId, Pageable pageable) {
        return PageResponse.from(
                paymentTransactionRepository.findByBuyerIdOrderByCreatedAtDesc(ownerId, pageable),
                PaymentTransactionResponse::from);
    }

    private Subscription expireIfPast(Subscription subscription) {
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE && subscription.getExpiresAt().isBefore(LocalDateTime.now())) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
        }
        return subscription;
    }
}
