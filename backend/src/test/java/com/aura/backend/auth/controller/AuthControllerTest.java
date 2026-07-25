package com.aura.backend.auth.controller;

import com.aura.backend.auth.dto.AuthResponse;
import com.aura.backend.auth.dto.UserSummary;
import com.aura.backend.auth.exception.EmailAlreadyExistsException;
import com.aura.backend.auth.exception.InvalidCredentialsException;
import com.aura.backend.auth.service.AuthService;
import com.aura.backend.common.exception.GlobalExceptionHandler;
import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class AuthControllerTest {

    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        mockMvc = standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void registerReturns201WithTokensAndUserSummary() throws Exception {
        when(authService.register(any())).thenReturn(new AuthResponse(
                "access-token", "refresh-token", "Bearer", 900L,
                new UserSummary(1L, "qui@example.com", "Qui", Role.USER, AuthProvider.LOCAL)));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "qui@example.com",
                                  "password": "SuperSecret123",
                                  "fullName": "Qui"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.user.role").value("USER"));
    }

    @Test
    void registerRejectsShortPassword() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "qui@example.com",
                                  "password": "short",
                                  "fullName": "Qui"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void registerRejectsDuplicateEmailWith409() throws Exception {
        when(authService.register(any())).thenThrow(new EmailAlreadyExistsException("qui@example.com"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "qui@example.com",
                                  "password": "SuperSecret123",
                                  "fullName": "Qui"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void loginRejectsWrongPasswordWith401() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "qui@example.com",
                                  "password": "WrongPassword"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    void refreshReturnsNewTokenPair() throws Exception {
        when(authService.refresh(any())).thenReturn(new AuthResponse(
                "new-access-token", "new-refresh-token", "Bearer", 900L,
                new UserSummary(1L, "qui@example.com", "Qui", Role.USER, AuthProvider.LOCAL)));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "refreshToken": "some-valid-refresh-token" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("new-access-token"));
    }
}
