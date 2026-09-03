package com.aura.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
    @NotBlank(message = "Google ID Token hoặc thông tin xác thực không được để trống")
    String idToken,
    String email,
    String fullName,
    String picture
) {}
