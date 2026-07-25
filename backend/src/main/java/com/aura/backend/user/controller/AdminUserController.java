package com.aura.backend.user.controller;

import com.aura.backend.auth.security.AuraUserPrincipal;
import com.aura.backend.common.response.ApiEnvelope;
import com.aura.backend.common.response.PageResponse;
import com.aura.backend.user.dto.UpdateUserRoleRequest;
import com.aura.backend.user.dto.UpdateUserStatusRequest;
import com.aura.backend.user.dto.UserResponse;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only: manage accounts (FR-31), assign roles / RBAC (FR-32, NFR-12), search/filter (FR-18).
 * Path is already gated to ROLE_ADMIN in SecurityConfiguration; @PreAuthorize here is a second,
 * explicit line of defense at the method level in case the path rule is ever refactored.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserManagementService userManagementService;

    public AdminUserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public ApiEnvelope<PageResponse<UserResponse>> search(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiEnvelope.success(userManagementService.search(role, keyword, pageable));
    }

    @GetMapping("/{id}")
    public ApiEnvelope<UserResponse> get(@PathVariable Long id) {
        return ApiEnvelope.success(userManagementService.get(id));
    }

    @PatchMapping("/{id}/role")
    public ApiEnvelope<UserResponse> updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal AuraUserPrincipal actingAdmin) {
        return ApiEnvelope.success(userManagementService.updateRole(id, request.role(), actingAdmin.getId()));
    }

    @PatchMapping("/{id}/status")
    public ApiEnvelope<UserResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal AuraUserPrincipal actingAdmin) {
        return ApiEnvelope.success(userManagementService.updateStatus(id, request.enabled(), actingAdmin.getId()));
    }
}
