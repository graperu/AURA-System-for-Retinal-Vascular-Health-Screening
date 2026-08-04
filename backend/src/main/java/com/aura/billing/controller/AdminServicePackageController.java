package com.aura.billing.controller;

import com.aura.billing.dto.CreateServicePackageRequest;
import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.dto.UpdateServicePackageRequest;
import com.aura.billing.dto.UpdateServicePackageStatusRequest;
import com.aura.billing.service.ServicePackageService;
import com.aura.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** FR-34: Admin quản lý gói dịch vụ, giá, và mô hình billing. */
@RestController
@RequestMapping("/api/v1/admin/packages")
@PreAuthorize("hasRole('ADMIN')")
public class AdminServicePackageController {

    private final ServicePackageService servicePackageService;

    public AdminServicePackageController(ServicePackageService servicePackageService) {
        this.servicePackageService = servicePackageService;
    }

    @GetMapping
    public ApiResponse<List<ServicePackageResponse>> listAll() {
        return ApiResponse.success("Lấy danh sách gói dịch vụ thành công", servicePackageService.listAll());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServicePackageResponse>> create(@Valid @RequestBody CreateServicePackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo gói dịch vụ thành công", servicePackageService.create(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ServicePackageResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateServicePackageRequest request) {
        return ApiResponse.success("Cập nhật gói dịch vụ thành công", servicePackageService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<ServicePackageResponse> setActive(@PathVariable Long id, @Valid @RequestBody UpdateServicePackageStatusRequest request) {
        return ApiResponse.success("Cập nhật trạng thái gói dịch vụ thành công", servicePackageService.setActive(id, request.active()));
    }
}