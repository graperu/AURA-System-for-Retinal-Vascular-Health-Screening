package com.aura.billing.service;

import com.aura.billing.dto.CreditsResponse;
import com.aura.billing.dto.InvoiceResponse;
import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.PurchaseRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    public PaymentTransactionResponse purchaseOrRenew(UUID ownerId, Long servicePackageId, PurchaseRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UserNotFoundException(ownerId.toString()));
        ServicePackage servicePackage = servicePackageService.findOrThrow(servicePackageId);

        if (!servicePackage.isActive()) {
            throw new PackageInactiveException(servicePackageId);
        }
        assertScopeMatches(owner, servicePackage);

        String provider = (request != null && request.paymentMethod() != null && !request.paymentMethod().isBlank())
                ? request.paymentMethod().trim().toUpperCase()
                : "VNPAY";
        String simulateOutcome = (request != null) ? request.simulateOutcome() : null;

        PaymentTransaction transaction = paymentTransactionRepository.save(PaymentTransaction.builder()
                .buyer(owner)
                .servicePackage(servicePackage)
                .amount(servicePackage.getPrice())
                .status(PaymentStatus.PENDING)
                .provider(provider)
                .build());

        PaymentGateway.GatewayResult result = paymentGateway.charge(
                owner.getEmail(),
                servicePackage.getPrice(),
                provider,
                simulateOutcome);

        if (result.pending()) {
            transaction.setProviderReference(result.providerReference());
            paymentTransactionRepository.save(transaction);
            return PaymentTransactionResponse.from(transaction);
        }

        if (!result.success()) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason(result.failureReason());
            transaction.setProviderReference(result.providerReference());
            paymentTransactionRepository.save(transaction);
            throw new PaymentFailedException(
                    result.failureReason() != null ? result.failureReason() : "Payment failed.");
        }

        transaction.setStatus(PaymentStatus.SUCCEEDED);
        transaction.setProviderReference(result.providerReference());
        transaction.setPaidAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        grantOrExtendCredits(owner, servicePackage);

        return PaymentTransactionResponse.from(transaction);
    }

    @Transactional
    public PaymentTransactionResponse confirmPayment(UUID ownerId, Long paymentId) {
        PaymentTransaction tx = findOwnedTransaction(ownerId, paymentId);
        if (tx.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ có thể xác nhận giao dịch đang PENDING. Hiện tại: " + tx.getStatus());
        }
        tx.setStatus(PaymentStatus.SUCCEEDED);
        tx.setPaidAt(LocalDateTime.now());
        paymentTransactionRepository.save(tx);
        grantOrExtendCredits(tx.getBuyer(), tx.getServicePackage());
        return PaymentTransactionResponse.from(tx);
    }

    @Transactional
    public PaymentTransactionResponse failPayment(UUID ownerId, Long paymentId, String reason) {
        PaymentTransaction tx = findOwnedTransaction(ownerId, paymentId);
        if (tx.getStatus() != PaymentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ có thể hủy giao dịch đang PENDING. Hiện tại: " + tx.getStatus());
        }
        tx.setStatus(PaymentStatus.FAILED);
        tx.setFailureReason(reason != null && !reason.isBlank() ? reason : "Người dùng hủy / timeout");
        paymentTransactionRepository.save(tx);
        return PaymentTransactionResponse.from(tx);
    }

    @Transactional
    public PaymentTransactionResponse refund(UUID ownerId, Long paymentId, String reason) {
        PaymentTransaction tx = findOwnedTransaction(ownerId, paymentId);
        if (tx.getStatus() != PaymentStatus.SUCCEEDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ hoàn tiền được giao dịch SUCCEEDED. Hiện tại: " + tx.getStatus());
        }

        PaymentGateway.GatewayResult gw = paymentGateway.refund(tx.getProviderReference());
        if (!gw.success()) {
            throw new PaymentFailedException(
                    gw.failureReason() != null ? gw.failureReason() : "Gateway từ chối hoàn tiền.");
        }

        subscriptionRepository
                .findByOwnerIdAndServicePackageId(ownerId, tx.getServicePackage().getId())
                .ifPresent(sub -> {
                    int credits = tx.getServicePackage().getCredits() != null
                            ? tx.getServicePackage().getCredits() : 0;
                    sub.setRemainingCredits(Math.max(0, sub.getRemainingCredits() - credits));
                    subscriptionRepository.save(sub);
                });

        String note = "REFUNDED" + (reason != null && !reason.isBlank() ? ": " + reason : "");
        tx.setFailureReason(note);
        paymentTransactionRepository.save(tx);

        return PaymentTransactionResponse.from(tx);
    }

    public CreditsResponse myCredits(UUID ownerId) {
        int total = subscriptionRepository.findByOwnerId(ownerId).stream()
                .map(this::expireIfPast)
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE)
                .mapToInt(Subscription::getRemainingCredits)
                .sum();
        return new CreditsResponse(total);
    }

    public InvoiceResponse invoice(UUID ownerId, Long paymentId) {
        PaymentTransaction tx = findOwnedTransaction(ownerId, paymentId);
        String invNo = "AURA-" + tx.getId() + "-" +
                (tx.getPaidAt() != null
                        ? tx.getPaidAt().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                        : "DRAFT");
        return new InvoiceResponse(
                invNo,
                tx.getId(),
                tx.getServicePackage().getId(),
                tx.getServicePackage().getName(),
                tx.getAmount(),
                "VND",
                tx.getStatus(),
                tx.getProvider(),
                tx.getProviderReference(),
                tx.getFailureReason(),
                tx.getCreatedAt(),
                tx.getPaidAt());
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

    private PaymentTransaction findOwnedTransaction(UUID ownerId, Long paymentId) {
        PaymentTransaction tx = paymentTransactionRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy giao dịch #" + paymentId));
        if (!tx.getBuyer().getId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Không có quyền truy cập giao dịch này.");
        }
        return tx;
    }

    private Subscription expireIfPast(Subscription subscription) {
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE
                && subscription.getExpiresAt().isBefore(LocalDateTime.now())) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
        }
        return subscription;
    }
}