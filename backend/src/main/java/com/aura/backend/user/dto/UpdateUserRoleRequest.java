package com.aura.backend.user.dto;

import com.aura.backend.user.entity.Role;
import jakarta.validation.constraints.NotNull;

/** FR-32: admin assigns/changes a user's role. */
public record UpdateUserRoleRequest(@NotNull Role role) {
}
