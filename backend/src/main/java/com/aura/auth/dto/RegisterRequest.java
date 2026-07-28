package com.aura.auth.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank
        @Size(min = 12, max = 128)
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$")
        String password,
    @Size(max = 150) String fullName) {}
