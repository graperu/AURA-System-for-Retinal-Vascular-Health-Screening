package com.aura.backend.billing.controller;

import com.aura.backend.billing.dto.CreateServicePackageRequest;
import com.aura.backend.billing.dto.ServicePackageResponse;
import com.aura.backend.billing.dto.UpdateServicePackageRequest;
import com.aura.backend.billing.dto.UpdateServicePackageStatusRequest;
import com.aura.backend.billing.service.ServicePackageService;
import com.aura.backend.common.response.ApiEnvelope;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** FR-34: Admin manages service packages, pricing, and billing models. */
@RestController
@RequestMapping("/api/v1/admin/packages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminServicePackageController {

    private final ServicePackageService servicePackageService;

    public AdminServicePackageController(ServicePackageService servicePackageService) {
        this.servicePackageService = servicePackageService;
    }

    @GetMapping
    public ApiEnvelope<List<ServicePackageResponse>> listAll() {
        return ApiEnvelope.success(servicePackageService.listAll());
    }

    @PostMapping
    public ResponseEntity<ApiEnvelope<ServicePackageResponse>> create(@Valid @RequestBody CreateServicePackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiEnvelope.success(servicePackageService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiEnvelope<ServicePackageResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateServicePackageRequest request) {
        return ApiEnvelope.success(servicePackageService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiEnvelope<ServicePackageResponse> setActive(@PathVariable Long id, @Valid @RequestBody UpdateServicePackageStatusRequest request) {
        return ApiEnvelope.success(servicePackageService.setActive(id, request.active()));
    }
}
