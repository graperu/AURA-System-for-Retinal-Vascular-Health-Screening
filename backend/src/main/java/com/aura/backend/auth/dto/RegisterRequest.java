package com.aura.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Public self-registration (FR-1). Always creates a USER-role, LOCAL-provider account. */
public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 72, message = "must be between 8 and 72 characters") String password,
        @NotBlank @Size(max = 120) String fullName) {
}
