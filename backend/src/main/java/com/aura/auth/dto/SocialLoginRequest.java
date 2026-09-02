package com.aura.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SocialLoginRequest(
    @NotBlank(message = "Nhà cung cấp mạng xã hội không được để trống (google, microsoft, apple, facebook, github)")
    String provider,
    @NotBlank(message = "ID Token hoặc token xác thực không được để trống")
    String idToken,
    String email,
    String fullName,
    String picture
) {}
