package com.aura.billing.controller;

import com.aura.billing.dto.ServicePackageResponse;
import com.aura.billing.entity.PackageScope;
import com.aura.billing.service.ServicePackageService;
import com.aura.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Danh mục gói dịch vụ công khai — không cần đăng nhập, giống trang bảng giá. */
@RestController
@RequestMapping("/api/v1/packages")
public class ServicePackageController {

    private final ServicePackageService servicePackageService;

    public ServicePackageController(ServicePackageService servicePackageService) {
        this.servicePackageService = servicePackageService;
    }

    @GetMapping
    public ApiResponse<List<ServicePackageResponse>> browse(
            @RequestParam(defaultValue = "INDIVIDUAL") PackageScope scope) {
        return ApiResponse.success("Lấy danh sách gói dịch vụ thành công", servicePackageService.browse(scope));
    }
}