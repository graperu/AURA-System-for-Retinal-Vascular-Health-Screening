package com.aura.backend.billing.controller;

import com.aura.backend.billing.dto.ServicePackageResponse;
import com.aura.backend.billing.entity.PackageScope;
import com.aura.backend.billing.service.ServicePackageService;
import com.aura.backend.common.response.ApiEnvelope;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public pricing catalog — no login required, same as a marketing/pricing page. */
@RestController
@RequestMapping("/api/v1/packages")
public class ServicePackageController {

    private final ServicePackageService servicePackageService;

    public ServicePackageController(ServicePackageService servicePackageService) {
        this.servicePackageService = servicePackageService;
    }

    @GetMapping
    public ApiEnvelope<List<ServicePackageResponse>> browse(
            @RequestParam(defaultValue = "INDIVIDUAL") PackageScope scope) {
        return ApiEnvelope.success(servicePackageService.browse(scope));
    }
}
