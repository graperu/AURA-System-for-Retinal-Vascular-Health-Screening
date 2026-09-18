package com.aura.billing.service;

import com.aura.billing.config.PaymentGatewayProperties;
import com.aura.billing.dto.PaymentStatusResponse;
import com.aura.billing.dto.PaymentTransactionResponse;
import com.aura.billing.dto.SubscriptionResponse;
import com.aura.billing.entity.*;
import com.aura.billing.exception.PackageInactiveException;
import com.aura.billing.exception.PackageScopeMismatchException;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.SubscriptionRepository;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.common.response.PageResponse;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.exception.UserNotFoundException;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final ServicePackageService servicePackageService;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PaymentGateway paymentGateway;
    private final com.aura.notification.service.UserNotificationService userNotificationService;
    private final PaymentGatewayProperties properties;

    @Autowired
    public BillingService(ServicePackageService servicePackageService,
                          SubscriptionRepository subscriptionRepository,
                          PaymentTransactionRepository paymentTransactionRepository,
                          UserRepository userRepository,
                          UserRoleRepository userRoleRepository,
                          PaymentGateway paymentGateway,
                          com.aura.notification.service.UserNotificationService userNotificationService,
                          PaymentGatewayProperties properties) {
        this.servicePackageService = servicePackageService;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.paymentGateway = paymentGateway;
        this.userNotificationService = userNotificationService;
        this.properties = properties != null ? properties : new PaymentGatewayProperties();
    }

    public BillingService(ServicePackageService servicePackageService,
                          SubscriptionRepository subscriptionRepository,
                          PaymentTransactionRepository paymentTransactionRepository,
                          UserRepository userRepository,
                          UserRoleRepository userRoleRepository,
                          PaymentGateway paymentGateway,
                          com.aura.notification.service.UserNotificationService userNotificationService) {
        this(servicePackageService, subscriptionRepository, paymentTransactionRepository,
             userRepository, userRoleRepository, paymentGateway, userNotificationService,
             new PaymentGatewayProperties());
    }

    /**
     * Khởi tạo giao dịch thanh toán (FR-11, FR-28):
     * - Tạo PaymentTransaction ở trạng thái PENDING.
     * - Sinh mã giao dịch và nội dung chuyển khoản VietQR duy nhất.
     * - Đặt hạn thanh toán 15 phút.
     * - TUYỆT ĐỐI KHÔNG CỘNG CREDIT TẠI ĐÂY.
     */
    @Transactional
    public PaymentTransactionResponse initiateCheckout(UUID ownerId, Long servicePackageId, String paymentMethod) {
        User owner = userRepository.findById(ownerId).orElseThrow(() -> new UserNotFoundException(ownerId.toString()));
        ServicePackage servicePackage = servicePackageService.findOrThrow(servicePackageId);

        if (!servicePackage.isActive()) {
            throw new PackageInactiveException(servicePackageId);
        }
        assertScopeMatches(owner, servicePackage);

        String method = paymentMethod != null && !paymentMethod.isBlank()
                ? paymentMethod.trim().toUpperCase()
                : "VNPAY";

        String randomSuffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String transferContent = "AURA NAP " + servicePackage.getId() + " KHAM " + randomSuffix;
        String qrCodeUrl = generateVietQrUrl(servicePackage.getPrice(), transferContent);

        PaymentGateway.GatewayResult result = paymentGateway.charge(owner.getEmail(), servicePackage.getPrice(), method);

        if (!result.success()) {
            paymentTransactionRepository.save(PaymentTransaction.builder()
                    .buyer(owner)
                    .servicePackage(servicePackage)
                    .amount(servicePackage.getPrice())
                    .status(PaymentStatus.FAILED)
                    .provider(result.providerName() != null ? result.providerName() : method)
                    .failureReason(result.failureReason())
                    .transferContent(transferContent)
                    .qrCodeUrl(qrCodeUrl)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build());
            throw new PaymentFailedException(result.failureReason() != null ? result.failureReason() : "Payment failed.");
        }

        String providerRef = result.providerReference() != null && !result.providerReference().isBlank()
                ? result.providerReference()
                : ("AURA_TXN_" + System.currentTimeMillis() + "_" + randomSuffix);

        String finalPaymentUrl = ("VIETQR".equalsIgnoreCase(method) || "BANK_TRANSFER".equalsIgnoreCase(method))
                ? qrCodeUrl
                : result.paymentUrl();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .buyer(owner)
                .servicePackage(servicePackage)
                .amount(servicePackage.getPrice())
                .status(PaymentStatus.PENDING)
                .provider(result.providerName())
                .providerReference(providerRef)
                .transferContent(transferContent)
                .qrCodeUrl(qrCodeUrl)
                .paymentUrl(finalPaymentUrl)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();

        PaymentTransaction savedTxn = paymentTransactionRepository.save(transaction);

        return PaymentTransactionResponse.from(savedTxn, finalPaymentUrl, result.merchantId());
    }

    @Transactional
    public PaymentTransactionResponse initiateCheckout(UUID ownerId, Long servicePackageId) {
        return initiateCheckout(ownerId, servicePackageId, "VNPAY");
    }

    /**
     * Tương thích ngược với các endpoint và test cũ.
     * Chuyển toàn bộ luồng mua sang initiateCheckout (trạng thái PENDING).
     */
    @Transactional
    public PaymentTransactionResponse purchaseOrRenew(UUID ownerId, Long servicePackageId) {
        return initiateCheckout(ownerId, servicePackageId, "VNPAY");
    }

    @Transactional
    public PaymentTransactionResponse purchaseOrRenew(UUID ownerId, Long servicePackageId, String paymentMethod) {
        return initiateCheckout(ownerId, servicePackageId, paymentMethod);
    }

    /**
     * Xử lý xác nhận thanh toán thành công từ Webhook / IPN:
     * - Tìm giao dịch theo providerReference hoặc transferContent.
     * - Idempotency: Nếu đã SUCCEEDED, không cộng credit lần 2.
     * - Kiểm tra số tiền: phải khớp với giá trị gói cước trong DB.
     * - Cập nhật status = SUCCEEDED, paidAt = now(), lưu gatewayTransactionNo.
     * - Cộng lượt khám qua grantOrExtendCredits.
     * - Phát thông báo realtime cho người dùng.
     */
    @Transactional
    public PaymentTransaction processPaymentSuccess(String providerReference, String gatewayTxnNo, BigDecimal amount) {
        Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByProviderReference(providerReference);
        if (txnOpt.isEmpty()) {
            txnOpt = paymentTransactionRepository.findByTransferContent(providerReference);
        }
        PaymentTransaction transaction = txnOpt.orElseThrow(() ->
                new ResourceNotFoundException("Không tìm thấy giao dịch tương ứng với mã: " + providerReference));

        // Idempotency: Kiểm tra nếu giao dịch đã hoàn tất
        if (transaction.getStatus() == PaymentStatus.SUCCEEDED) {
            log.warn("Idempotency: Giao dịch {} đã hoàn thành trước đó. Bỏ qua cộng credit lần 2.", providerReference);
            return transaction;
        }

        // Fail-Closed: Xác thực số tiền thanh toán thực tế
        if (amount == null || transaction.getAmount().compareTo(amount) > 0) {
            log.error("Xác thực thanh toán thất bại: Số tiền nhận được ({}) không hợp lệ hoặc nhỏ hơn giá trị gói ({}) của giao dịch {}",
                    amount, transaction.getAmount(), providerReference);
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason("Số tiền thanh toán không hợp lệ: Yêu cầu " + transaction.getAmount() + " nhưng nhận " + (amount != null ? amount : "NULL"));
            return paymentTransactionRepository.save(transaction);
        }

        transaction.setStatus(PaymentStatus.SUCCEEDED);
        transaction.setPaidAt(LocalDateTime.now());
        transaction.setGatewayTransactionNo(gatewayTxnNo);
        PaymentTransaction savedTxn = paymentTransactionRepository.save(transaction);

        grantOrExtendCredits(transaction.getBuyer(), transaction.getServicePackage());

        // FR-9: Phát thông báo nạp gói thành công
        try {
            userNotificationService.sendNotificationToUser(
                    transaction.getBuyer().getId(),
                    "Nạp gói dịch vụ thành công",
                    "Bạn đã thanh toán thành công gói '" + transaction.getServicePackage().getName() + "'. Cộng thêm "
                            + transaction.getServicePackage().getCredits() + " lượt khám vào tài khoản qua cổng " + transaction.getProvider() + ".",
                    "BILLING",
                    "SUCCESS",
                    "/billing"
            );
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo nạp gói cho người dùng {}: {}", transaction.getBuyer().getId(), e.getMessage());
        }

        return savedTxn;
    }

    /**
     * Xử lý xác nhận thanh toán thất bại / hủy bỏ từ Webhook / IPN.
     */
    @Transactional
    public PaymentTransaction processPaymentFailure(String providerReference, String failureReason) {
        Optional<PaymentTransaction> txnOpt = paymentTransactionRepository.findByProviderReference(providerReference);
        if (txnOpt.isEmpty()) {
            txnOpt = paymentTransactionRepository.findByTransferContent(providerReference);
        }
        if (txnOpt.isEmpty()) {
            return null;
        }
        PaymentTransaction transaction = txnOpt.get();
        if (transaction.getStatus() == PaymentStatus.PENDING) {
            transaction.setStatus(PaymentStatus.FAILED);
            transaction.setFailureReason(failureReason);
            return paymentTransactionRepository.save(transaction);
        }
        return transaction;
    }

    /**
     * Xác nhận thanh toán cục bộ cho môi trường phát triển / thử nghiệm / sandbox (FR-11, FR-28):
     * - Chống IDOR: Kiểm tra ownerId khớp với người mua.
     * - Nếu giao dịch đang ở trạng thái PENDING, tự động kích hoạt thanh toán thành công và cộng credits.
     */
    @Transactional
    public PaymentTransaction confirmLocalPayment(UUID ownerId, Long transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch: " + transactionId));

        if (!transaction.getBuyer().getId().equals(ownerId)) {
            throw new AccessDeniedException("Bạn không có quyền xác nhận giao dịch này.");
        }

        if (transaction.getStatus() == PaymentStatus.SUCCEEDED) {
            return transaction;
        }

        String ref = transaction.getProviderReference() != null && !transaction.getProviderReference().isBlank()
                ? transaction.getProviderReference()
                : transaction.getTransferContent();

        return processPaymentSuccess(ref, "LOCAL_TXN_" + System.currentTimeMillis(), transaction.getAmount());
    }

    /**
     * Lấy trạng thái giao dịch phục vụ Polling thời gian thực (FR-11, FR-28):
     * - Chống IDOR: Kiểm tra ownerId khớp với người mua.
     * - Fail-Closed: Tự động đánh dấu EXPIRED nếu quá 15 phút.
     */
    @Transactional
    public PaymentStatusResponse getTransactionStatus(UUID ownerId, Long transactionId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch: " + transactionId));

        if (!transaction.getBuyer().getId().equals(ownerId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập thông tin giao dịch này.");
        }

        if (transaction.getStatus() == PaymentStatus.PENDING
                && transaction.getExpiresAt() != null
                && transaction.getExpiresAt().isBefore(LocalDateTime.now())) {
            transaction.setStatus(PaymentStatus.EXPIRED);
            transaction.setFailureReason("Giao dịch đã hết hạn thanh toán (15 phút).");
            transaction = paymentTransactionRepository.save(transaction);
        }

        return PaymentStatusResponse.from(transaction);
    }

    /** Kiểm tra scope tương thích giữa User và ServicePackage */
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

    private String generateVietQrUrl(BigDecimal amount, String transferContent) {
        var vietqr = properties.getVietqr();
        String encodedContent = URLEncoder.encode(transferContent, StandardCharsets.UTF_8);
        String encodedName = URLEncoder.encode(vietqr.getAccountName(), StandardCharsets.UTF_8);
        return String.format(
                "https://img.vietqr.io/image/%s-%s-%s.png?amount=%d&addInfo=%s&accountName=%s",
                vietqr.getBankId(),
                vietqr.getAccountNo(),
                vietqr.getTemplate(),
                amount != null ? amount.longValue() : 0L,
                encodedContent,
                encodedName
        );
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

    public int getRemainingCredits(UUID ownerId) {
        return subscriptionRepository.findByOwnerId(ownerId).stream()
                .map(this::expireIfPast)
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE)
                .mapToInt(Subscription::getRemainingCredits)
                .sum();
    }

    @Transactional
    public boolean deductCredits(UUID ownerId, int amount) {
        if (ownerId == null || amount <= 0) {
            return true;
        }
        List<Subscription> activeSubs = subscriptionRepository.findByOwnerIdForUpdate(ownerId).stream()
                .map(this::expireIfPast)
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE && s.getRemainingCredits() > 0)
                .sorted(java.util.Comparator.comparing(Subscription::getExpiresAt))
                .toList();

        int totalAvailable = activeSubs.stream().mapToInt(Subscription::getRemainingCredits).sum();
        if (totalAvailable < amount) {
            return false;
        }

        int remainingToDeduct = amount;
        for (Subscription sub : activeSubs) {
            int subCredits = sub.getRemainingCredits();
            if (subCredits >= remainingToDeduct) {
                sub.setRemainingCredits(subCredits - remainingToDeduct);
                subscriptionRepository.save(sub);
                remainingToDeduct = 0;
                break;
            } else {
                remainingToDeduct -= subCredits;
                sub.setRemainingCredits(0);
                subscriptionRepository.save(sub);
            }
        }
        return true;
    }

    @Transactional
    public boolean deductCredit(UUID ownerId) {
        return deductCredits(ownerId, 1);
    }

    @Transactional
    public void refundCredit(UUID ownerId) {
        refundCredit(ownerId, 1);
    }

    @Transactional
    public void refundCredit(UUID ownerId, int amount) {
        if (ownerId == null || amount <= 0) return;
        List<Subscription> subs = subscriptionRepository.findByOwnerIdForUpdate(ownerId).stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE)
                .sorted(java.util.Comparator.comparing(Subscription::getExpiresAt).reversed())
                .toList();
        if (!subs.isEmpty()) {
            Subscription sub = subs.get(0);
            sub.setRemainingCredits(sub.getRemainingCredits() + amount);
            subscriptionRepository.save(sub);
            log.info("Hoàn trả {} lượt khám cho người dùng {}", amount, ownerId);
        }
    }

    private Subscription expireIfPast(Subscription subscription) {
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE && subscription.getExpiresAt().isBefore(LocalDateTime.now())) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(subscription);
        }
        return subscription;
    }
}
