package com.aura.backend.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserSummary user) {

    public static AuthResponse of(String accessToken, String refreshToken, long expiresInSeconds, UserSummary user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresInSeconds, user);
    }
}
