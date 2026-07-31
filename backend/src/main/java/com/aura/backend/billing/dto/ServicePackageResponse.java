package com.aura.backend.billing.dto;

import com.aura.backend.billing.entity.PackageScope;
import com.aura.backend.billing.entity.ServicePackage;

import java.math.BigDecimal;

public record ServicePackageResponse(
        Long id,
        String name,
        String description,
        PackageScope scope,
        BigDecimal price,
        Integer credits,
        Integer validityDays,
        boolean active) {

    public static ServicePackageResponse from(ServicePackage servicePackage) {
        return new ServicePackageResponse(
                servicePackage.getId(), servicePackage.getName(), servicePackage.getDescription(),
                servicePackage.getScope(), servicePackage.getPrice(), servicePackage.getCredits(),
                servicePackage.getValidityDays(), servicePackage.isActive());
    }
}
