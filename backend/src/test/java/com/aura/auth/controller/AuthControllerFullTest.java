package com.aura.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.auth.config.AuthProperties;
import com.aura.auth.dto.GoogleLoginRequest;
import com.aura.auth.dto.LoginRequest;
import com.aura.auth.dto.LoginResponse;
import com.aura.auth.dto.RegisterRequest;
import com.aura.auth.dto.SendOtpRequest;
import com.aura.auth.dto.SocialLoginRequest;
import com.aura.auth.dto.UserResponse;
import com.aura.auth.dto.VerifyOtpRequest;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.service.AuthService;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@ExtendWith(MockitoExtension.class)
class AuthControllerFullTest {

  @Mock
  private AuthService authService;

  private AuthProperties authProperties;
  private AuthController authController;
  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  private AuraUserPrincipal testPrincipal;
  private UUID testUserId;
  private UserResponse testUserResponse;
  private LoginResponse testLoginResponse;
  private AuthService.LoginResult testLoginResult;

  @BeforeEach
  void setUp() {
    authProperties = new AuthProperties(
        "secret-key-that-is-at-least-32-bytes-long-for-testing",
        15,
        7,
        "Strict",
        true
    );
    authController = new AuthController(authService, authProperties);
    objectMapper = new ObjectMapper();

    testUserId = UUID.randomUUID();
    testPrincipal = new AuraUserPrincipal(
        testUserId,
        "doctor@aura.test",
        "EncryptedSecret123!",
        true,
        List.of("DOCTOR")
    );
    testUserResponse = new UserResponse(
        testUserId,
        "doctor@aura.test",
        "BS. Nguyễn Văn A",
        List.of("DOCTOR"),
        true
    );
    testLoginResponse = new LoginResponse(
        "mock-access-jwt-token",
        "Bearer",
        900L,
        testUserResponse
    );
    testLoginResult = new AuthService.LoginResult(testLoginResponse, "mock-refresh-token-uuid");

    mockMvc = MockMvcBuilders.standaloneSetup(authController)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
          @Override
          public boolean supportsParameter(MethodParameter parameter) {
            return parameter.getParameterType().isAssignableFrom(AuraUserPrincipal.class);
          }

          @Override
          public Object resolveArgument(MethodParameter parameter,
                                        ModelAndViewContainer mavContainer,
                                        NativeWebRequest webRequest,
                                        WebDataBinderFactory binderFactory) {
            return testPrincipal;
          }
        })
        .build();
  }

  @Nested
  @DisplayName("POST /api/v1/auth/login")
  class LoginTests {

    @Test
    @DisplayName("Đăng nhập thành công -> HTTP 200, trả về ApiResponse kèm Set-Cookie aura_refresh")
    void login_success() throws Exception {
      LoginRequest request = new LoginRequest("doctor@aura.test", "SecurePassword123!");
      when(authService.login(any(LoginRequest.class))).thenReturn(testLoginResult);

      mockMvc.perform(post("/api/v1/auth/login")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(header().exists(HttpHeaders.SET_COOKIE))
          .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString(AuthController.COOKIE + "=mock-refresh-token-uuid")))
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.accessToken").value("mock-access-jwt-token"))
          .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
          .andExpect(jsonPath("$.data.user.email").value("doctor@aura.test"));

      verify(authService).login(any(LoginRequest.class));
    }

    @Test
    @DisplayName("Đăng nhập thất bại (Sai thông tin) -> HTTP 401 INVALID_CREDENTIALS")
    void login_invalidCredentials_returns401() throws Exception {
      LoginRequest request = new LoginRequest("doctor@aura.test", "WrongPassword!");
      when(authService.login(any(LoginRequest.class)))
          .thenThrow(new AuthException(ErrorCode.INVALID_CREDENTIALS, "Email hoặc mật khẩu không chính xác"));

      mockMvc.perform(post("/api/v1/auth/login")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.success").value(false))
          .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_CREDENTIALS.name()));
    }

    @Test
    @DisplayName("Đăng nhập thất bại (Validation lỗi do email trống) -> HTTP 400")
    void login_validationFailed_returns400() throws Exception {
      LoginRequest request = new LoginRequest("", "");

      mockMvc.perform(post("/api/v1/auth/login")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.success").value(false))
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/auth/register")
  class RegisterTests {

    @Test
    @DisplayName("Đăng ký tài khoản thành công -> HTTP 201 CREATED")
    void register_success() throws Exception {
      RegisterRequest request = new RegisterRequest(
          "newpatient@aura.test",
          "StrongPass1234!",
          "Nguyễn Thị Cúc",
          "USER"
      );
      UserResponse registeredUser = new UserResponse(
          UUID.randomUUID(),
          request.email(),
          request.fullName(),
          List.of("USER"),
          true
      );
      when(authService.register(any(RegisterRequest.class))).thenReturn(registeredUser);

      mockMvc.perform(post("/api/v1/auth/register")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.email").value("newpatient@aura.test"))
          .andExpect(jsonPath("$.data.fullName").value("Nguyễn Thị Cúc"));

      verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    @DisplayName("Đăng ký thất bại (Mật khẩu không đạt chuẩn regex/độ dài) -> HTTP 400")
    void register_validationFail_weakPassword() throws Exception {
      RegisterRequest request = new RegisterRequest(
          "invalidpass@aura.test",
          "weak",
          "Nguyễn Văn Yếu",
          "USER"
      );

      mockMvc.perform(post("/api/v1/auth/register")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.success").value(false))
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }

    @Test
    @DisplayName("Đăng ký thất bại (Email đã tồn tại) -> HTTP 409 CONFLICT")
    void register_emailAlreadyExists_returns409() throws Exception {
      RegisterRequest request = new RegisterRequest(
          "existing@aura.test",
          "StrongPass1234!",
          "Người Dùng Cũ",
          "USER"
      );
      when(authService.register(any(RegisterRequest.class)))
          .thenThrow(new AuthException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng"));

      mockMvc.perform(post("/api/v1/auth/register")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isConflict())
          .andExpect(jsonPath("$.code").value(ErrorCode.EMAIL_ALREADY_EXISTS.name()));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/auth/send-otp")
  class SendOtpTests {

    @Test
    @DisplayName("Gửi OTP thành công -> HTTP 200 kèm thông tin thời hạn OTP")
    void sendOtp_success() throws Exception {
      SendOtpRequest request = new SendOtpRequest("user@aura.test", "Trần Văn A", "REGISTER");
      Map<String, Object> otpData = new HashMap<>();
      otpData.put("email", "user@aura.test");
      otpData.put("expiresInSeconds", 300L);

      when(authService.sendRegistrationOtp(any(SendOtpRequest.class))).thenReturn(300L);
      when(authService.getOtpDataResponse(eq("user@aura.test"), eq(300L))).thenReturn(otpData);

      mockMvc.perform(post("/api/v1/auth/send-otp")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.email").value("user@aura.test"))
          .andExpect(jsonPath("$.data.expiresInSeconds").value(300));

      verify(authService).sendRegistrationOtp(any(SendOtpRequest.class));
      verify(authService).getOtpDataResponse("user@aura.test", 300L);
    }

    @Test
    @DisplayName("Gửi OTP thất bại (Email sai định dạng) -> HTTP 400")
    void sendOtp_invalidEmail_returns400() throws Exception {
      SendOtpRequest request = new SendOtpRequest("not-an-email", "Trần Văn A", "REGISTER");

      mockMvc.perform(post("/api/v1/auth/send-otp")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }

    @Test
    @DisplayName("Gửi OTP thất bại (Email đã tồn tại trong hệ thống) -> HTTP 409")
    void sendOtp_emailExists_returns409() throws Exception {
      SendOtpRequest request = new SendOtpRequest("used@aura.test", "Trần Văn A", "REGISTER");
      when(authService.sendRegistrationOtp(any(SendOtpRequest.class)))
          .thenThrow(new AuthException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng"));

      mockMvc.perform(post("/api/v1/auth/send-otp")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isConflict())
          .andExpect(jsonPath("$.code").value(ErrorCode.EMAIL_ALREADY_EXISTS.name()));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/auth/verify-otp")
  class VerifyOtpTests {

    @Test
    @DisplayName("Xác thực OTP và đăng ký thành công -> HTTP 200 kèm Set-Cookie")
    void verifyOtpAndRegister_success() throws Exception {
      VerifyOtpRequest request = new VerifyOtpRequest(
          "user@aura.test",
          "123456",
          "Trần Văn A",
          "StrongPass1234!"
      );
      when(authService.verifyOtpAndRegister(any(VerifyOtpRequest.class))).thenReturn(testLoginResult);

      mockMvc.perform(post("/api/v1/auth/verify-otp")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(header().exists(HttpHeaders.SET_COOKIE))
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.accessToken").value("mock-access-jwt-token"));

      verify(authService).verifyOtpAndRegister(any(VerifyOtpRequest.class));
    }

    @Test
    @DisplayName("Xác thực OTP thất bại (OTP không hợp lệ hoặc hết hạn) -> HTTP 401")
    void verifyOtpAndRegister_invalidOtp_returns401() throws Exception {
      VerifyOtpRequest request = new VerifyOtpRequest(
          "user@aura.test",
          "999999",
          "Trần Văn A",
          "StrongPass1234!"
      );
      when(authService.verifyOtpAndRegister(any(VerifyOtpRequest.class)))
          .thenThrow(new AuthException(ErrorCode.INVALID_CREDENTIALS, "Mã OTP không chính xác hoặc đã hết hạn"));

      mockMvc.perform(post("/api/v1/auth/verify-otp")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_CREDENTIALS.name()));
    }

    @Test
    @DisplayName("Xác thực OTP thất bại (OTP không đủ 6 ký tự) -> HTTP 400")
    void verifyOtpAndRegister_validationFail_shortOtp() throws Exception {
      VerifyOtpRequest request = new VerifyOtpRequest(
          "user@aura.test",
          "123",
          "Trần Văn A",
          "StrongPass1234!"
      );

      mockMvc.perform(post("/api/v1/auth/verify-otp")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/auth/google & /social")
  class SocialLoginTests {

    @Test
    @DisplayName("Đăng nhập Google thành công -> HTTP 200 kèm Set-Cookie")
    void loginGoogle_success() throws Exception {
      GoogleLoginRequest request = new GoogleLoginRequest("valid-google-id-token", "google@aura.test", "Google User", null);
      when(authService.loginWithGoogle(any(GoogleLoginRequest.class))).thenReturn(testLoginResult);

      mockMvc.perform(post("/api/v1/auth/google")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(header().exists(HttpHeaders.SET_COOKIE))
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.accessToken").value("mock-access-jwt-token"));

      verify(authService).loginWithGoogle(any(GoogleLoginRequest.class));
    }

    @Test
    @DisplayName("Đăng nhập Google thất bại (Token không hợp lệ) -> HTTP 401")
    void loginGoogle_invalidToken_returns401() throws Exception {
      GoogleLoginRequest request = new GoogleLoginRequest("invalid-id-token", "google@aura.test", "Google User", null);
      when(authService.loginWithGoogle(any(GoogleLoginRequest.class)))
          .thenThrow(new AuthException(ErrorCode.INVALID_TOKEN, "Google token không hợp lệ"));

      mockMvc.perform(post("/api/v1/auth/google")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_TOKEN.name()));
    }

    @Test
    @DisplayName("Đăng nhập mạng xã hội thành công -> HTTP 200")
    void loginSocial_success() throws Exception {
      SocialLoginRequest request = new SocialLoginRequest("apple", "valid-apple-token", "apple@aura.test", "Apple User", null);
      when(authService.loginWithSocial(any(SocialLoginRequest.class))).thenReturn(testLoginResult);

      mockMvc.perform(post("/api/v1/auth/social")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(header().exists(HttpHeaders.SET_COOKIE))
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.accessToken").value("mock-access-jwt-token"));

      verify(authService).loginWithSocial(any(SocialLoginRequest.class));
    }

    @Test
    @DisplayName("Đăng nhập mạng xã hội thất bại (Thiếu provider) -> HTTP 400")
    void loginSocial_validationFail_blankProvider() throws Exception {
      SocialLoginRequest request = new SocialLoginRequest("", "valid-token", null, null, null);

      mockMvc.perform(post("/api/v1/auth/social")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }

    @Test
    @DisplayName("Đăng nhập mạng xã hội thất bại (Token xác thực thất bại) -> HTTP 401")
    void loginSocial_authFail_returns401() throws Exception {
      SocialLoginRequest request = new SocialLoginRequest("github", "fake-token", "git@aura.test", "Git User", null);
      when(authService.loginWithSocial(any(SocialLoginRequest.class)))
          .thenThrow(new AuthException(ErrorCode.INVALID_TOKEN, "Social token không hợp lệ"));

      mockMvc.perform(post("/api/v1/auth/social")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.code").value(ErrorCode.INVALID_TOKEN.name()));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/auth/refresh")
  class RefreshTokenTests {

    @Test
    @DisplayName("Làm mới token thành công từ Cookie aura_refresh -> HTTP 200 và cấp token mới")
    void refreshToken_successWithCookie() throws Exception {
      when(authService.refresh(eq("valid-refresh-cookie-value"))).thenReturn(testLoginResult);

      mockMvc.perform(post("/api/v1/auth/refresh")
              .cookie(new Cookie(AuthController.COOKIE, "valid-refresh-cookie-value")))
          .andExpect(status().isOk())
          .andExpect(header().exists(HttpHeaders.SET_COOKIE))
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.accessToken").value("mock-access-jwt-token"));

      verify(authService).refresh("valid-refresh-cookie-value");
    }

    @Test
    @DisplayName("Làm mới token thất bại khi không gửi cookie -> HTTP 401 REFRESH_TOKEN_INVALID")
    void refreshToken_missingCookie_returns401() throws Exception {
      mockMvc.perform(post("/api/v1/auth/refresh"))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.code").value(ErrorCode.REFRESH_TOKEN_INVALID.name()));
    }

    @Test
    @DisplayName("Làm mới token thất bại khi refresh token bị thu hồi hoặc hết hạn -> HTTP 401")
    void refreshToken_revokedToken_returns401() throws Exception {
      when(authService.refresh(eq("revoked-token")))
          .thenThrow(new AuthException(ErrorCode.REFRESH_TOKEN_REVOKED, "Refresh token đã bị thu hồi"));

      mockMvc.perform(post("/api/v1/auth/refresh")
              .cookie(new Cookie(AuthController.COOKIE, "revoked-token")))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.code").value(ErrorCode.REFRESH_TOKEN_REVOKED.name()));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/auth/logout")
  class LogoutTests {

    @Test
    @DisplayName("Đăng xuất có kèm cookie -> HTTP 200, gọi service.logout và xóa cookie")
    void logout_withCookie_success() throws Exception {
      doNothing().when(authService).logout("active-refresh-token");

      mockMvc.perform(post("/api/v1/auth/logout")
              .cookie(new Cookie(AuthController.COOKIE, "active-refresh-token")))
          .andExpect(status().isOk())
          .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")))
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.message").value("Đăng xuất thành công"));

      verify(authService).logout("active-refresh-token");
    }

    @Test
    @DisplayName("Đăng xuất không kèm cookie -> HTTP 200, gọi service.logout(null) và xóa cookie")
    void logout_withoutCookie_success() throws Exception {
      doNothing().when(authService).logout(null);

      mockMvc.perform(post("/api/v1/auth/logout"))
          .andExpect(status().isOk())
          .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("Max-Age=0")))
          .andExpect(jsonPath("$.success").value(true));

      verify(authService).logout(null);
    }
  }

  @Nested
  @DisplayName("GET /api/v1/auth/me")
  class MeTests {

    @Test
    @DisplayName("Lấy thông tin tài khoản hiện tại thành công -> HTTP 200")
    void me_success() throws Exception {
      when(authService.me(any(AuraUserPrincipal.class))).thenReturn(testUserResponse);

      mockMvc.perform(get("/api/v1/auth/me"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.email").value("doctor@aura.test"))
          .andExpect(jsonPath("$.data.fullName").value("BS. Nguyễn Văn A"));

      verify(authService).me(any(AuraUserPrincipal.class));
    }
  }

  @Nested
  @DisplayName("Passwordless / Magic Link Simulation (sendMagicLink & verifyMagicLink)")
  class MagicLinkSimulationTests {

    @Test
    @DisplayName("Mô phỏng Gửi Magic Link: sử dụng cơ chế SendOtpRequest với loại MAGIC_LINK")
    void sendMagicLink_simulation_success() {
      SendOtpRequest request = new SendOtpRequest("patient@aura.test", "Trần Thị B", "MAGIC_LINK");
      when(authService.sendRegistrationOtp(eq(request))).thenReturn(600L);
      Map<String, Object> responseData = Map.of("email", "patient@aura.test", "expiresInSeconds", 600L);
      when(authService.getOtpDataResponse(eq("patient@aura.test"), eq(600L))).thenReturn(responseData);

      ApiResponse<Map<String, Object>> response = authController.sendOtp(request);

      assertThat(response).isNotNull();
      assertThat(response.success()).isTrue();
      assertThat(response.data()).containsEntry("email", "patient@aura.test");
      assertThat(response.data()).containsEntry("expiresInSeconds", 600L);
      verify(authService).sendRegistrationOtp(request);
    }

    @Test
    @DisplayName("Mô phỏng Xác thực Magic Link: xác thực token hoặc OTP tạo session đăng nhập")
    void verifyMagicLink_simulation_success() {
      VerifyOtpRequest request = new VerifyOtpRequest("patient@aura.test", "654321", "Trần Thị B", "StrongPass123!");
      when(authService.verifyOtpAndRegister(eq(request))).thenReturn(testLoginResult);

      ResponseEntity<ApiResponse<LoginResponse>> response = authController.verifyOtp(request);

      assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
      assertThat(response.getBody()).isNotNull();
      assertThat(response.getBody().data().accessToken()).isEqualTo("mock-access-jwt-token");
      verify(authService).verifyOtpAndRegister(request);
    }
  }
}
