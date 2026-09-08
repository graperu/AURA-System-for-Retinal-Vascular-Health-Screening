package com.aura.admin.controller;

import com.aura.admin.dto.RoleDto;
import com.aura.admin.dto.UpdateRolePermissionsRequest;
import com.aura.admin.dto.UpdateRoleRequest;
import com.aura.admin.service.AdminRoleService;
import com.aura.common.response.ApiResponse;
import com.aura.role.enums.RoleName;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/roles")
@Tag(name = "Admin RBAC", description = "Định nghĩa vai trò và quyền truy cập (FR-32)")
public class AdminRoleController {

  private final AdminRoleService adminRoleService;

  public AdminRoleController(AdminRoleService adminRoleService) {
    this.adminRoleService = adminRoleService;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "List system roles and permission catalog")
  public ApiResponse<List<RoleDto>> listRoles() {
    return ApiResponse.success("Lấy danh sách vai trò thành công", adminRoleService.listRoles());
  }

  @PutMapping("/{roleName}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Update role description")
  public ApiResponse<RoleDto> updateRole(
      @PathVariable RoleName roleName, @Valid @RequestBody UpdateRoleRequest request) {
    return ApiResponse.success("Đã cập nhật mô tả vai trò", adminRoleService.updateRole(roleName, request));
  }

  @PutMapping("/{roleName}/permissions")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Enable or disable access permissions for a role")
  public ApiResponse<RoleDto> updatePermissions(
      @PathVariable RoleName roleName, @Valid @RequestBody UpdateRolePermissionsRequest request) {
    return ApiResponse.success(
        "Đã cập nhật quyền truy cập", adminRoleService.updatePermissions(roleName, request));
  }
}
