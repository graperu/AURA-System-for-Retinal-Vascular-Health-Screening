package com.aura.auth.controller;

import com.aura.auth.config.AuthProperties;
import com.aura.auth.dto.*;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.service.AuthService;
import com.aura.common.response.*;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  public static final String COOKIE = "aura_refresh";
  private final AuthService service;
  private final AuthProperties props;

  public AuthController(AuthService s, AuthProperties p) {
    service = s;
    props = p;
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest q) {
    return ApiResponse.success("Đăng ký thành công", service.register(q));
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest q) {
    var r = service.login(q);
    return withCookie(r, "Đăng nhập thành công");
  }

  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<LoginResponse>> refresh(
      @CookieValue(name = COOKIE, required = false) String raw) {
    if (raw == null)
      throw new AuthException(ErrorCode.REFRESH_TOKEN_INVALID, "Refresh token không hợp lệ");
    var r = service.refresh(raw);
    return withCookie(r, "Làm mới token thành công");
  }

  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout(
      @CookieValue(name = COOKIE, required = false) String raw) {
    service.logout(raw);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, cookie("", 0).toString())
        .body(ApiResponse.success("Đăng xuất thành công", null));
  }

  @GetMapping("/me")
  public ApiResponse<UserResponse> me(@AuthenticationPrincipal AuraUserPrincipal p) {
    return ApiResponse.success("Lấy thông tin tài khoản thành công", service.me(p));
  }

  private ResponseEntity<ApiResponse<LoginResponse>> withCookie(
      AuthService.LoginResult r, String message) {
    return ResponseEntity.ok()
        .header(
            HttpHeaders.SET_COOKIE,
            cookie(r.refreshToken(), Duration.ofDays(props.refreshTokenDays()).toSeconds())
                .toString())
        .body(ApiResponse.success(message, r.response()));
  }

  private ResponseCookie cookie(String value, long age) {
    return ResponseCookie.from(COOKIE, value)
        .httpOnly(true)
        .secure(props.cookieSecure())
        .sameSite(props.cookieSameSite())
        .path("/api/v1/auth")
        .maxAge(age)
        .build();
  }
}
