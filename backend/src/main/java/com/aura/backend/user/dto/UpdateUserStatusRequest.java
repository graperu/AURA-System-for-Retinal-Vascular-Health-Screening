package com.aura.backend.user.dto;

import jakarta.validation.constraints.NotNull;

/** FR-31: admin enables/disables an account. */
public record UpdateUserStatusRequest(@NotNull Boolean enabled) {
}
