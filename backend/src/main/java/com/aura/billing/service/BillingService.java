package com.aura.billing.service;

import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.entity.*;
import com.aura.billing.exception.PackageInactiveException;
import com.aura.billing.exception.PackageScopeMismatchException;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.SubscriptionRepository;
import com.aura.common.response.PageResponse;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.exception.UserNotFoundException;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BillingService {

    private final ServicePackageService servicePackageService;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PaymentGateway paymentGateway;

    public BillingService(ServicePackageService servicePackageService,
                           SubscriptionRepository subscriptionRepository,
                           PaymentTransactionRepository paymentTransactionRepository,
                           UserRepository userRepository,
                           UserRoleRepository userRoleRepository,
                           PaymentGateway paymentGateway) {
        this.servicePackageService = servicePackageService;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.paymentGateway = paymentGateway;
    }

    @Transactional
    public PaymentTransactionResponse purchaseOrRenew(UUID ownerId, Long servicePackageId) {
        User owner = userRepository.findById(ownerId).orElseThrow(() -> new UserNotFoundException(ownerId.toString()));
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
                .provider("unconfigured")
                .build());

        PaymentGateway.GatewayResult result = paymentGateway.charge(owner.getEmail(), servicePackage.getPrice());
        transaction.setProvider(result.providerName());

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

    /** Main dùng bảng UserRole (nhiều role/user), nên kiểm tra scope bằng cách tìm xem
     *  user có role tương ứng hay không, thay vì owner.getRole() kiểu 1-role-duy-nhất. */
    private void assertScopeMatches(User owner, ServicePackage servicePackage) {
        List<RoleName> ownerRoles = userRoleRepository.findAllByUserId(owner.getId()).stream()
                .map(ur -> ur.getRole().getName())
                .toList();

        boolean matches = switch (servicePackage.getScope()) {
            case INDIVIDUAL -> ownerRoles.contains(RoleName.USER);
            case CLINIC -> ownerRoles.contains(RoleName.CLINIC);
        };
        if (!matches) {
            throw new PackageScopeMismatchException(
                    "Gói '" + servicePackage.getName() + "' chỉ dành cho tài khoản " + servicePackage.getScope() + ".");
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

    public List<SubscriptionResponse> mySubscriptions(UUID ownerId) {
        return subscriptionRepository.findByOwnerId(ownerId).stream()
                .map(this::expireIfPast)
                .map(SubscriptionResponse::from)
                .toList();
    }

    public PageResponse<PaymentTransactionResponse> myPayments(UUID ownerId, Pageable pageable) {
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
