package com.aura.admin.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record UpdateRolePermissionsRequest(
    @NotNull List<PermissionToggle> permissions) {

  public record PermissionToggle(UUID id, String code, @NotNull Boolean enabled) {}
}
