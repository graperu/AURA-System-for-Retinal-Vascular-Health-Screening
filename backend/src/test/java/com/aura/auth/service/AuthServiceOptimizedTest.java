package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.dto.SocialLoginRequest;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.JwtTokenProvider;
import com.aura.common.response.ErrorCode;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - Optimized OAuth Providers & Branch Coverage Unit Tests")
class AuthServiceOptimizedTest {

  @Mock private UserRepository userRepository;
  @Mock private RoleRepository roleRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private AuthenticationManager authenticationManager;
  @Mock private JwtTokenProvider jwtTokenProvider;
  @Mock private RefreshTokenService refreshTokenService;
  @Mock private OtpService otpService;

  private AuthService authService;
  private Role defaultUserRole;

  private Role createRole(RoleName name) {
    Role role = new Role();
    ReflectionTestUtils.setField(role, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(role, "name", name);
    return role;
  }

  @BeforeEach
  void setUp() {
    authService =
        new AuthService(
            userRepository,
            roleRepository,
            userRoleRepository,
            passwordEncoder,
            authenticationManager,
            jwtTokenProvider,
            refreshTokenService,
            otpService);

    defaultUserRole = createRole(RoleName.USER);
  }

  @ParameterizedTest(name = "Provider {0} should fallback to display name Người dùng {1}")
  @CsvSource({
    "apple, Apple",
    "facebook, Facebook",
    "github, GitHub",
    "microsoft, Microsoft",
    "google, Google",
    "unknown_provider, Google"
  })
  @DisplayName("loginWithSocial: Kiểm tra switch case OAuth providers và fallback tên mặc định")
  void testOAuthProviderSwitchCaseAndDefaultDisplayName(String provider, String expectedDisplayName) {
    String testEmail = "oauth.user@aurascreening.ai";
    SocialLoginRequest request = new SocialLoginRequest(provider, null, testEmail, null, null);

    when(userRepository.findByEmailIgnoreCase(testEmail)).thenReturn(Optional.empty());
    when(passwordEncoder.encode(any())).thenReturn("encoded_dummy_hash");
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(defaultUserRole));

    when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
      User user = invocation.getArgument(0);
      ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
      return user;
    });

    when(userRoleRepository.findAllByUserId(any())).thenReturn(Collections.emptyList());
    when(refreshTokenService.issue(any())).thenReturn(new RefreshTokenService.Issued("mock_raw_refresh_token", null));
    when(jwtTokenProvider.create(any(), any())).thenReturn("mock_jwt_access_token");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    AuthService.LoginResult result = authService.loginWithSocial(request);

    assertThat(result).isNotNull();
    assertThat(result.refreshToken()).isEqualTo("mock_raw_refresh_token");
    assertThat(result.response().user().roles()).containsExactly("USER");

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCaptor.capture());
    User createdUser = userCaptor.getValue();
    assertThat(createdUser.getFullName()).isEqualTo("Người dùng " + expectedDisplayName);
    assertThat(createdUser.getEmail()).isEqualTo(testEmail);
    assertThat(createdUser.isActive()).isTrue();
    assertThat(createdUser.isEmailVerified()).isTrue();
  }

  @Test
  @DisplayName("loginWithSocial: Gán default role USER khi userRoles rỗng trong cơ sở dữ liệu")
  void testDefaultRoleUserWhenUserRolesIsEmpty() {
    String testEmail = "existing.user@aurascreening.ai";
    User existingUser = new User(testEmail, "encoded_pass", "Existing Dr. AURA");
    UUID userId = UUID.randomUUID();
    ReflectionTestUtils.setField(existingUser, "id", userId);
    existingUser.setActive(true);

    SocialLoginRequest request = new SocialLoginRequest("google", null, testEmail, "Existing Dr. AURA", null);

    when(userRepository.findByEmailIgnoreCase(testEmail)).thenReturn(Optional.of(existingUser));
    when(userRoleRepository.findAllByUserId(userId)).thenReturn(Collections.emptyList());
    when(refreshTokenService.issue(existingUser)).thenReturn(new RefreshTokenService.Issued("refresh_token_abc", null));
    when(jwtTokenProvider.create(eq(userId), eq(List.of("USER")))).thenReturn("jwt_role_user");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    AuthService.LoginResult result = authService.loginWithSocial(request);

    assertThat(result.response().user().roles()).containsExactly("USER");
    assertThat(result.response().user().fullName()).isEqualTo("Existing Dr. AURA");
  }

  @Test
  @DisplayName("loginWithSocial: Cập nhật fullName mới nếu user cũ có fullName null hoặc blank")
  void testUpdateFullNameWhenExistingUserFullNameIsBlank() {
    String testEmail = "blankname@aurascreening.ai";
    User userWithoutName = new User(testEmail, "pass", "");
    UUID userId = UUID.randomUUID();
    ReflectionTestUtils.setField(userWithoutName, "id", userId);
    userWithoutName.setActive(true);

    SocialLoginRequest request = new SocialLoginRequest("google", null, testEmail, "Dr. John Doe", null);

    when(userRepository.findByEmailIgnoreCase(testEmail)).thenReturn(Optional.of(userWithoutName));
    when(userRoleRepository.findAllByUserId(userId))
        .thenReturn(List.of(new UserRole(userWithoutName, defaultUserRole)));
    when(refreshTokenService.issue(userWithoutName)).thenReturn(new RefreshTokenService.Issued("refresh_token_xyz", null));
    when(jwtTokenProvider.create(any(), any())).thenReturn("jwt_ok");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    AuthService.LoginResult result = authService.loginWithSocial(request);

    assertThat(userWithoutName.getFullName()).isEqualTo("Dr. John Doe");
    verify(userRepository).save(userWithoutName);
  }

  @Test
  @DisplayName("loginWithSocial: Trích xuất email và name từ idToken hợp lệ (JWT format)")
  void testExtractEmailAndNameFromValidIdToken() {
    String payload = "{\"email\":\"token.user@aurascreening.ai\",\"name\":\"Token User\"}";
    String base64Payload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    String dummyJwt = "eyJhbGciOiJIUzI1NiJ9." + base64Payload + ".mockSignature";

    SocialLoginRequest request = new SocialLoginRequest(null, dummyJwt, null, null, null);

    when(userRepository.findByEmailIgnoreCase("token.user@aurascreening.ai")).thenReturn(Optional.empty());
    when(passwordEncoder.encode(any())).thenReturn("encoded_dummy_hash");
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(defaultUserRole));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
      User user = invocation.getArgument(0);
      ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
      return user;
    });
    when(userRoleRepository.findAllByUserId(any())).thenReturn(Collections.emptyList());
    when(refreshTokenService.issue(any())).thenReturn(new RefreshTokenService.Issued("refresh_token_idtoken", null));
    when(jwtTokenProvider.create(any(), any())).thenReturn("jwt_ok");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    AuthService.LoginResult result = authService.loginWithSocial(request);

    assertThat(result).isNotNull();
    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(captor.capture());
    assertThat(captor.getValue().getEmail()).isEqualTo("token.user@aurascreening.ai");
    assertThat(captor.getValue().getFullName()).isEqualTo("Token User");
  }

  @ParameterizedTest
  @ValueSource(strings = {"", "   "})
  @DisplayName("loginWithSocial: Ném AuthException khi không có email trong token lẫn request")
  void testThrowAuthExceptionWhenEmailIsMissingOrBlank(String blankEmail) {
    SocialLoginRequest request = new SocialLoginRequest("apple", null, blankEmail, "Name", null);

    assertThatThrownBy(() -> authService.loginWithSocial(request))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.INVALID_CREDENTIALS)
        .hasMessageContaining("Không thể trích xuất thông tin email");
  }

  @Test
  @DisplayName("loginWithSocial: Chặn đăng nhập với tài khoản đã bị vô hiệu hóa (active = false)")
  void testBlockDisabledAccountOnSocialLogin() {
    String testEmail = "disabled@aurascreening.ai";
    User disabledUser = new User(testEmail, "pass", "Disabled User");
    disabledUser.setActive(false);
    ReflectionTestUtils.setField(disabledUser, "id", UUID.randomUUID());

    SocialLoginRequest request = new SocialLoginRequest("github", null, testEmail, "Disabled User", null);
    when(userRepository.findByEmailIgnoreCase(testEmail)).thenReturn(Optional.of(disabledUser));

    assertThatThrownBy(() -> authService.loginWithSocial(request))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.ACCOUNT_DISABLED)
        .hasMessageContaining("Tài khoản đã bị vô hiệu hóa");
  }

  @Test
  @DisplayName("loginWithSocial: Xử lý an toàn khi idToken có định dạng lạ/không phải base64 hợp lệ")
  void testCorruptedIdTokenHandledGracefully() {
    String testEmail = "corrupted.token@aurascreening.ai";
    // idToken contains '.' but part 2 is not valid Base64
    SocialLoginRequest request = new SocialLoginRequest("google", "header.not_valid_base64!!!.sig", testEmail, "Fallback Name", null);

    when(userRepository.findByEmailIgnoreCase(testEmail)).thenReturn(Optional.empty());
    when(passwordEncoder.encode(any())).thenReturn("encoded_pass");
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(defaultUserRole));
    when(userRepository.save(any(User.class))).thenAnswer(i -> {
      User u = i.getArgument(0);
      ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
      return u;
    });
    when(userRoleRepository.findAllByUserId(any())).thenReturn(Collections.emptyList());
    when(refreshTokenService.issue(any())).thenReturn(new RefreshTokenService.Issued("tok", null));
    when(jwtTokenProvider.create(any(), any())).thenReturn("jwt");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    AuthService.LoginResult result = authService.loginWithSocial(request);
    assertThat(result).isNotNull();
    assertThat(result.response().user().fullName()).isEqualTo("Fallback Name");
  }

  @Test
  @DisplayName("loginWithGoogle: Chuyển tiếp chính xác sang loginWithSocial")
  void testLoginWithGoogleDelegation() {
    String testEmail = "google.direct@aurascreening.ai";
    com.aura.auth.dto.GoogleLoginRequest googleReq =
        new com.aura.auth.dto.GoogleLoginRequest("dummy.token", testEmail, "Dr. Google User", "https://pic.url");

    when(userRepository.findByEmailIgnoreCase(testEmail)).thenReturn(Optional.empty());
    when(passwordEncoder.encode(any())).thenReturn("encoded_pass");
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(defaultUserRole));
    when(userRepository.save(any(User.class))).thenAnswer(i -> {
      User u = i.getArgument(0);
      ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
      return u;
    });
    when(userRoleRepository.findAllByUserId(any())).thenReturn(Collections.emptyList());
    when(refreshTokenService.issue(any())).thenReturn(new RefreshTokenService.Issued("tok", null));
    when(jwtTokenProvider.create(any(), any())).thenReturn("jwt");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    AuthService.LoginResult result = authService.loginWithGoogle(googleReq);
    assertThat(result).isNotNull();
    assertThat(result.response().user().email()).isEqualTo(testEmail);
  }

  @Test
  @DisplayName("loginWithSocial: Ném ngoại lệ khi cả idToken và request.email đều là null")
  void testThrowWhenBothIdTokenAndEmailAreNull() {
    SocialLoginRequest request = new SocialLoginRequest("google", null, null, "Name", null);

    assertThatThrownBy(() -> authService.loginWithSocial(request))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.INVALID_CREDENTIALS);
  }

  @Test
  @DisplayName("register: Tạo tài khoản thành công khi fullName là null và role là USER hoặc CLINIC")
  void testRegisterWhenFullNameIsNull() {
    String email = "null.name.user@aura.ai";
    com.aura.auth.dto.RegisterRequest reqUser = new com.aura.auth.dto.RegisterRequest(email, "StrongPass123!", null, "USER");

    when(userRepository.existsByEmailIgnoreCase(email)).thenReturn(false);
    when(passwordEncoder.encode("StrongPass123!")).thenReturn("hash_pass");
    when(userRepository.save(any(User.class))).thenAnswer(i -> {
      User u = i.getArgument(0);
      ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
      return u;
    });
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(defaultUserRole));

    var response = authService.register(reqUser);
    assertThat(response).isNotNull();
    assertThat(response.fullName()).isNull();
    assertThat(response.roles()).containsExactly("USER");

    // Test with role = CLINIC
    String clinicEmail = "clinic.null.name@aura.ai";
    com.aura.auth.dto.RegisterRequest reqClinic = new com.aura.auth.dto.RegisterRequest(clinicEmail, "StrongPass123!", null, "CLINIC");
    Role clinicRole = createRole(RoleName.CLINIC);
    when(userRepository.existsByEmailIgnoreCase(clinicEmail)).thenReturn(false);
    when(roleRepository.findByName(RoleName.CLINIC)).thenReturn(Optional.of(clinicRole));

    var responseClinic = authService.register(reqClinic);
    assertThat(responseClinic).isNotNull();
    assertThat(responseClinic.fullName()).isNull();
    assertThat(responseClinic.roles()).containsExactly("CLINIC");
  }

  @Test
  @DisplayName("register & verifyOtpAndRegister: Ném AuthException khi email đã tồn tại")
  void testRegisterAndVerifyOtpWhenEmailAlreadyExists() {
    String email = "existing@aura.ai";
    when(userRepository.existsByEmailIgnoreCase(email)).thenReturn(true);

    // 1. register
    var regReq = new com.aura.auth.dto.RegisterRequest(email, "pass123", "Name", "USER");
    assertThatThrownBy(() -> authService.register(regReq))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.EMAIL_ALREADY_EXISTS);

    // 2. sendRegistrationOtp
    var otpReq = new com.aura.auth.dto.SendOtpRequest(email, "Name", "REGISTER");
    assertThatThrownBy(() -> authService.sendRegistrationOtp(otpReq))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.EMAIL_ALREADY_EXISTS);

    // 3. verifyOtpAndRegister
    var verifyReq = new com.aura.auth.dto.VerifyOtpRequest(email, "123456", "Name", "StrongPassword123!");
    assertThatThrownBy(() -> authService.verifyOtpAndRegister(verifyReq))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.EMAIL_ALREADY_EXISTS);
  }

  @Test
  @DisplayName("verifyOtpAndRegister: Xác thực và tạo tài khoản khi fullName là null")
  void testVerifyOtpAndRegisterWhenFullNameIsNull() {
    String email = "otp.null.name@aura.ai";
    com.aura.auth.dto.VerifyOtpRequest verifyReq = new com.aura.auth.dto.VerifyOtpRequest(email, "654321", null, "Password123!");

    when(userRepository.existsByEmailIgnoreCase(email)).thenReturn(false);
    when(passwordEncoder.encode("Password123!")).thenReturn("hash_encoded");
    when(userRepository.save(any(User.class))).thenAnswer(i -> {
      User u = i.getArgument(0);
      ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
      return u;
    });
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(defaultUserRole));
    when(refreshTokenService.issue(any())).thenReturn(new RefreshTokenService.Issued("refresh_tok_otp", null));
    when(jwtTokenProvider.create(any(), any())).thenReturn("jwt_tok_otp");
    when(jwtTokenProvider.expiresIn()).thenReturn(3600L);

    var result = authService.verifyOtpAndRegister(verifyReq);
    assertThat(result).isNotNull();
    assertThat(result.response().user().fullName()).isNull();
    assertThat(result.response().user().roles()).containsExactly("USER");
    verify(otpService).verifyOtp(email, "654321");
  }

  @Test
  @DisplayName("sendRegistrationOtp & getOtpDataResponse: Gửi OTP thành công và đóng gói phản hồi chuẩn")
  void testSendOtpAndDataResponse() {
    String email = "send.otp@aura.ai";
    when(userRepository.existsByEmailIgnoreCase(email)).thenReturn(false);
    when(otpService.sendOtp(email, "Doctor Hope", "REGISTER")).thenReturn(300L);

    long expiresIn = authService.sendRegistrationOtp(new com.aura.auth.dto.SendOtpRequest(email, "Doctor Hope", "REGISTER"));
    assertThat(expiresIn).isEqualTo(300L);

    var dataMap = authService.getOtpDataResponse("  " + email + "  ", expiresIn);
    assertThat(dataMap.get("email")).isEqualTo(email);
    assertThat(dataMap.get("expiresInSeconds")).isEqualTo(300L);
  }
}
