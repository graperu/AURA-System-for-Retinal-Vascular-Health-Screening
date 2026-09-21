package com.aura.admin.dto;

import com.aura.role.enums.RoleName;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
    @NotNull(message = "Vai trò không được để trống")
    RoleName role
) {
  public UpdateUserRoleRequest(RoleName role) {
    this.role = role;
  }

  @JsonCreator
  public static UpdateUserRoleRequest fromJson(
      @JsonProperty("role") RoleName role,
      @JsonProperty("roleName") RoleName roleName
  ) {
    return new UpdateUserRoleRequest(role != null ? role : roleName);
  }
}
