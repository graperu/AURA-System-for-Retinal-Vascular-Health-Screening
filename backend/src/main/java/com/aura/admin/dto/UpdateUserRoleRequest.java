package com.aura.admin.dto;

import com.aura.role.enums.RoleName;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
    @JsonProperty("role")
    @JsonAlias("roleName")
    @NotNull(message = "Vai trò không được để trống")
    RoleName role
) {}
