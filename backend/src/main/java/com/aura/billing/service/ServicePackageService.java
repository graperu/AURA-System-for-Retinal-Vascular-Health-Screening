package com.aura.billing.service;

import com.aura.billing.dto.CreateServicePackageRequest;
import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.dto.UpdateServicePackageRequest;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.ServicePackage;
import com.aura.billing.exception.ServicePackageNotFoundException;
import com.aura.billing.repository.PaymentTransactionRepository;
import com.aura.billing.repository.ServicePackageRepository;
import com.aura.billing.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** FR-34: Admin quản lý gói dịch vụ, giá, và mô hình billing. */
@Service
public class ServicePackageService {

    private final ServicePackageRepository servicePackageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    public ServicePackageService(
            ServicePackageRepository servicePackageRepository,
            @Autowired(required = false) SubscriptionRepository subscriptionRepository,
            @Autowired(required = false) PaymentTransactionRepository paymentTransactionRepository) {
        this.servicePackageRepository = servicePackageRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    public ServicePackageService(ServicePackageRepository servicePackageRepository) {
        this(servicePackageRepository, null, null);
    }

    public List<ServicePackageResponse> browse(PackageScope scope) {
        return servicePackageRepository.findByActiveTrueAndScope(scope).stream()
                .map(ServicePackageResponse::from)
                .toList();
    }

    public List<ServicePackageResponse> listAll() {
        return servicePackageRepository.findAll().stream().map(ServicePackageResponse::from).toList();
    }

    @Transactional
    public ServicePackageResponse create(CreateServicePackageRequest request) {
        ServicePackage servicePackage = ServicePackage.builder()
                .name(request.name())
                .description(request.description())
                .scope(request.scope())
                .price(request.price())
                .credits(request.credits())
                .validityDays(request.validityDays())
                .active(true)
                .build();
        return ServicePackageResponse.from(servicePackageRepository.save(servicePackage));
    }

    @Transactional
    public ServicePackageResponse update(Long id, UpdateServicePackageRequest request) {
        ServicePackage servicePackage = findOrThrow(id);
        servicePackage.setName(request.name());
        servicePackage.setDescription(request.description());
        servicePackage.setPrice(request.price());
        servicePackage.setCredits(request.credits());
        servicePackage.setValidityDays(request.validityDays());
        return ServicePackageResponse.from(servicePackageRepository.save(servicePackage));
    }

    @Transactional
    public ServicePackageResponse setActive(Long id, boolean active) {
        ServicePackage servicePackage = findOrThrow(id);
        servicePackage.setActive(active);
        return ServicePackageResponse.from(servicePackageRepository.save(servicePackage));
    }

    @Transactional
    public void delete(Long id) {
        ServicePackage servicePackage = findOrThrow(id);

        // 1. If financial transactions exist, cannot hard delete. Deactivate permanently to preserve audit records.
        if (paymentTransactionRepository != null && paymentTransactionRepository.existsByServicePackageId(id)) {
            servicePackage.setActive(false);
            servicePackageRepository.save(servicePackage);
            throw new IllegalStateException("Gói dịch vụ đã có lịch sử giao dịch thanh toán. Hệ thống đã tự động chuyển sang trạng thái ngưng bán để bảo toàn dữ liệu tài chính.");
        }

        // 2. Clean up any attached subscriptions
        if (subscriptionRepository != null && subscriptionRepository.existsByServicePackageId(id)) {
            subscriptionRepository.deleteAllByServicePackageId(id);
        }

        // 3. Remove service package
        servicePackageRepository.delete(servicePackage);
    }

    @Transactional
    public int batchDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return 0;
        int count = 0;
        for (Long id : ids) {
            try {
                delete(id);
                count++;
            } catch (Exception ignored) {
                // If soft-deactivated due to payment history, still count or skip
            }
        }
        return count;
    }

    ServicePackage findOrThrow(Long id) {
        return servicePackageRepository.findById(id)
                .orElseThrow(() -> new ServicePackageNotFoundException(id));
    }
}