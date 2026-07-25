package com.aura.backend.auth.controller;

import com.aura.backend.auth.dto.AuthResponse;
import com.aura.backend.auth.dto.LoginRequest;
import com.aura.backend.auth.dto.RefreshRequest;
import com.aura.backend.auth.dto.RegisterRequest;
import com.aura.backend.auth.dto.UserSummary;
import com.aura.backend.auth.security.AuraUserPrincipal;
import com.aura.backend.auth.service.AuthService;
import com.aura.backend.common.response.ApiEnvelope;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** FR-1: register/login/refresh with email+password. Google login is served separately via /oauth2/authorization/google. */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiEnvelope<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiEnvelope.success(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiEnvelope<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiEnvelope.success(authService.login(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiEnvelope<AuthResponse>> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(ApiEnvelope.success(authService.refresh(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiEnvelope<UserSummary>> me(@AuthenticationPrincipal AuraUserPrincipal principal) {
        return ResponseEntity.ok(ApiEnvelope.success(authService.currentUser(principal)));
    }
}
