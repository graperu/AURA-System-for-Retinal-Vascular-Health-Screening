package com.aura.backend.auth.security;

import com.aura.backend.auth.exception.InvalidTokenException;
import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("test-only-secret-key-that-is-at-least-32-bytes-long");
        properties.setIssuer("aura-backend-test");
        properties.setAccessTokenTtl(Duration.ofMinutes(15));
        properties.setRefreshTokenTtl(Duration.ofDays(7));
        jwtService = new JwtService(properties);

        user = User.builder()
                .id(42L)
                .email("doctor@example.com")
                .role(Role.DOCTOR)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build();
    }

    @Test
    void generatesAccessTokenCarryingSubjectAndRole() {
        String token = jwtService.generateAccessToken(user);

        Claims claims = jwtService.parse(token);

        assertThat(jwtService.subjectEmail(claims)).isEqualTo("doctor@example.com");
        assertThat(jwtService.role(claims)).isEqualTo(Role.DOCTOR);
        assertThat(jwtService.isAccessToken(claims)).isTrue();
        assertThat(jwtService.isRefreshToken(claims)).isFalse();
    }

    @Test
    void refreshTokenIsRejectedWhereAccessTokenIsRequired() {
        String refreshToken = jwtService.generateRefreshToken(user);
        Claims claims = jwtService.parse(refreshToken);

        assertThatThrownBy(() -> jwtService.requireType(claims, "access"))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsTokenSignedWithADifferentSecret() {
        JwtProperties otherProperties = new JwtProperties();
        otherProperties.setSecret("a-completely-different-secret-key-of-32-bytes+");
        JwtService otherIssuer = new JwtService(otherProperties);
        String tokenFromOtherIssuer = otherIssuer.generateAccessToken(user);

        assertThatThrownBy(() -> jwtService.parse(tokenFromOtherIssuer))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsGarbageToken() {
        assertThatThrownBy(() -> jwtService.parse("not-a-jwt-at-all"))
                .isInstanceOf(InvalidTokenException.class);
    }
}
