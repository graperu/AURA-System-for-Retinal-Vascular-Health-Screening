package com.aura.admin.controller;

import com.aura.admin.dto.AiConfigDto;
import com.aura.admin.dto.UpdateUserStatusRequest;
import com.aura.admin.dto.UserSummaryDto;
import com.aura.admin.service.AdminUserService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Management", description = "Endpoints for user management, clinic approvals, and AI config (FR-31, FR-32, FR-33, FR-38)")
public class AdminUserController {

  private final AdminUserService adminUserService;

  public AdminUserController(AdminUserService adminUserService) {
    this.adminUserService = adminUserService;
  }

  @GetMapping("/users")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "List all registered accounts with roles")
  public ApiResponse<PageResponse<UserSummaryDto>> getAllUsers(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<UserSummaryDto> users = adminUserService.getAllUsers(pageable);
    return ApiResponse.success(PageResponse.from(users));
  }

  @PutMapping("/users/{userId}/status")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Enable or disable a user/doctor/clinic account")
  public ApiResponse<UserSummaryDto> updateUserStatus(
      @PathVariable UUID userId,
      @Valid @RequestBody UpdateUserStatusRequest request) {
    return ApiResponse.success(adminUserService.updateUserStatus(userId, request));
  }

  @PutMapping("/clinics/{clinicId}/approve")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Approve a clinic registration")
  public ApiResponse<UserSummaryDto> approveClinic(@PathVariable UUID clinicId) {
    return ApiResponse.success(
        adminUserService.updateUserStatus(clinicId, new UpdateUserStatusRequest(true)));
  }

  @PutMapping("/clinics/{clinicId}/suspend")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Suspend a clinic organization account")
  public ApiResponse<UserSummaryDto> suspendClinic(@PathVariable UUID clinicId) {
    return ApiResponse.success(
        adminUserService.updateUserStatus(clinicId, new UpdateUserStatusRequest(false)));
  }

  @GetMapping("/ai-config")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Get global AI parameters and threshold configuration")
  public ApiResponse<AiConfigDto> getAiConfig() {
    return ApiResponse.success(adminUserService.getAiConfig());
  }

  @PutMapping("/ai-config")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Update global AI sensitivity, thresholds and retraining policy")
  public ApiResponse<AiConfigDto> updateAiConfig(@RequestBody AiConfigDto update) {
    return ApiResponse.success(adminUserService.updateAiConfig(update));
  }
}
