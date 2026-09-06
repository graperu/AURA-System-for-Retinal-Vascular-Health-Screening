package com.aura.billing.service;

import com.aura.billing.dto.CreateServicePackageRequest;
import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.dto.UpdateServicePackageRequest;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.entity.ServicePackage;
import com.aura.billing.exception.ServicePackageNotFoundException;
import com.aura.billing.repository.ServicePackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** FR-34: Admin quản lý gói dịch vụ, giá, và mô hình billing. */
@Service
public class ServicePackageService {

    private final ServicePackageRepository servicePackageRepository;

    public ServicePackageService(ServicePackageRepository servicePackageRepository) {
        this.servicePackageRepository = servicePackageRepository;
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

    ServicePackage findOrThrow(Long id) {
        return servicePackageRepository.findById(id)
                .orElseThrow(() -> new ServicePackageNotFoundException(id));
    }
}