package com.aura.admin.dto;

import com.aura.role.enums.RoleName;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
    @NotNull(message = "Vai trò không được để trống") RoleName role
) {
    
}
