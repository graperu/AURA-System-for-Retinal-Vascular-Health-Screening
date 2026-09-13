package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.dto.GoogleLoginRequest;
import com.aura.auth.dto.LoginRequest;
import com.aura.auth.dto.RegisterRequest;
import com.aura.auth.dto.SendOtpRequest;
import com.aura.auth.dto.SocialLoginRequest;
import com.aura.auth.dto.UserResponse;
import com.aura.auth.dto.VerifyOtpRequest;
import com.aura.auth.entity.RefreshToken;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
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
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceComprehensiveTest {

  @Mock private UserRepository users;
  @Mock private RoleRepository roles;
  @Mock private UserRoleRepository userRoles;
  @Mock private PasswordEncoder encoder;
  @Mock private AuthenticationManager auth;
  @Mock private JwtTokenProvider jwt;
  @Mock private RefreshTokenService refresh;
  @Mock private OtpService otpService;

  @InjectMocks private AuthService authService;

  private UUID testUserId;
  private User testUser;
  private Role userRole;
  private Role clinicRole;

  @BeforeEach
  void setUp() {
    testUserId = UUID.randomUUID();
    testUser = new User("user@example.com", "hashed_password", "Nguyễn Văn A");
    ReflectionTestUtils.setField(testUser, "id", testUserId);
    testUser.setActive(true);
    testUser.setEmailVerified(true);

    userRole = new Role();
    ReflectionTestUtils.setField(userRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(userRole, "name", RoleName.USER);

    clinicRole = new Role();
    ReflectionTestUtils.setField(clinicRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(clinicRole, "name", RoleName.CLINIC);
  }

  @Nested
  @DisplayName("login tests")
  class LoginTests {

    @Test
    @DisplayName("login success returns valid LoginResult with tokens and user info")
    void login_Success() {
      // Arrange
      var principal = new AuraUserPrincipal(testUserId, "user@example.com", "hashed_password", true, List.of("USER"));
      Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
      when(auth.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
      when(users.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(jwt.create(eq(testUserId), eq(List.of("USER")))).thenReturn("jwt.access.token");
      when(jwt.expiresIn()).thenReturn(3600L);
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      when(refresh.issue(testUser)).thenReturn(new RefreshTokenService.Issued("raw-refresh-token", mockTokenEntity));

      // Act
      var result = authService.login(new LoginRequest("User@Example.Com", "Password123!"));

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.refreshToken()).isEqualTo("raw-refresh-token");
      assertThat(result.response().accessToken()).isEqualTo("jwt.access.token");
      assertThat(result.response().tokenType()).isEqualTo("Bearer");
      assertThat(result.response().expiresIn()).isEqualTo(3600L);
      assertThat(result.response().user().email()).isEqualTo("user@example.com");
      assertThat(result.response().user().roles()).containsExactly("USER");
    }

    @Test
    @DisplayName("login with wrong password throws AuthException INVALID_CREDENTIALS")
    void login_WrongPassword_ThrowsInvalidCredentials() {
      // Arrange
      when(auth.authenticate(any(UsernamePasswordAuthenticationToken.class)))
          .thenThrow(new BadCredentialsException("Bad credentials"));

      // Act & Assert
      assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "WrongPassword")))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Email hoặc mật khẩu không chính xác");
          });
    }

    @Test
    @DisplayName("login with disabled account throws AuthException ACCOUNT_DISABLED via DisabledException")
    void login_DisabledAccount_ThrowsAccountDisabled() {
      // Arrange
      when(auth.authenticate(any(UsernamePasswordAuthenticationToken.class)))
          .thenThrow(new DisabledException("Account is disabled"));

      // Act & Assert
      assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "Password123!")))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.ACCOUNT_DISABLED);
            assertThat(e.getMessage()).contains("Tài khoản đã bị vô hiệu hóa");
          });
    }

    @Test
    @DisplayName("login with principal.enabled() == false throws AuthException ACCOUNT_DISABLED")
    void login_PrincipalNotEnabled_ThrowsAccountDisabled() {
      // Arrange
      var principal = new AuraUserPrincipal(testUserId, "user@example.com", "hashed_password", false, List.of("USER"));
      Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
      when(auth.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);

      // Act & Assert
      assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "Password123!")))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.ACCOUNT_DISABLED);
          });
    }

    @Test
    @DisplayName("login user not found in database throws NoSuchElementException")
    void login_UserNotFoundInDb_ThrowsNoSuchElementException() {
      // Arrange
      var principal = new AuraUserPrincipal(testUserId, "user@example.com", "hashed_password", true, List.of("USER"));
      Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
      when(auth.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
      when(users.findById(testUserId)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> authService.login(new LoginRequest("user@example.com", "Password123!")))
          .isInstanceOf(NoSuchElementException.class);
    }
  }

  @Nested
  @DisplayName("register tests")
  class RegisterTests {

    @Test
    @DisplayName("register with default role creates user with USER role")
    void register_DefaultRole_CreatesUser() {
      // Arrange
      when(users.existsByEmailIgnoreCase("newuser@example.com")).thenReturn(false);
      when(encoder.encode("StrongPassword123!")).thenReturn("encoded_pass");
      when(users.save(any(User.class))).thenAnswer(i -> {
        User u = i.getArgument(0);
        ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
        return u;
      });
      when(roles.findByName(RoleName.USER)).thenReturn(Optional.of(userRole));

      // Act
      UserResponse res = authService.register(new RegisterRequest(" NewUser@Example.Com ", "StrongPassword123!", "New User", null));

      // Assert
      assertThat(res).isNotNull();
      assertThat(res.email()).isEqualTo("newuser@example.com");
      assertThat(res.roles()).containsExactly("USER");
      verify(userRoles).save(argThat(ur -> ur.getRole().getName() == RoleName.USER));
    }

    @Test
    @DisplayName("register with CLINIC role assigns CLINIC role")
    void register_ClinicRole_AssignsClinicRole() {
      // Arrange
      when(users.existsByEmailIgnoreCase("clinic@example.com")).thenReturn(false);
      when(encoder.encode("StrongPassword123!")).thenReturn("encoded_pass");
      when(users.save(any(User.class))).thenAnswer(i -> {
        User u = i.getArgument(0);
        ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
        return u;
      });
      when(roles.findByName(RoleName.CLINIC)).thenReturn(Optional.of(clinicRole));

      // Act
      UserResponse res = authService.register(new RegisterRequest("clinic@example.com", "StrongPassword123!", "Clinic Central", "CLINIC"));

      // Assert
      assertThat(res.roles()).containsExactly("CLINIC");
      verify(userRoles).save(argThat(ur -> ur.getRole().getName() == RoleName.CLINIC));
    }

    @Test
    @DisplayName("register with existing email throws EMAIL_ALREADY_EXISTS")
    void register_ExistingEmail_ThrowsException() {
      // Arrange
      when(users.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

      // Act & Assert
      assertThatThrownBy(() -> authService.register(new RegisterRequest("existing@example.com", "Pass12345678!", "Name", null)))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
          });
    }
  }

  @Nested
  @DisplayName("verifyOtpAndRegister tests")
  class VerifyOtpAndRegisterTests {

    @Test
    @DisplayName("verifyOtpAndRegister success creates verified user and returns LoginResult")
    void verifyOtpAndRegister_Success() {
      // Arrange
      var req = new VerifyOtpRequest("verify@example.com", "123456", "Văn B", "StrongPassword123!");
      when(users.existsByEmailIgnoreCase("verify@example.com")).thenReturn(false);
      when(otpService.verifyOtp("verify@example.com", "123456")).thenReturn(true);
      when(encoder.encode("StrongPassword123!")).thenReturn("encoded_pwd");
      when(users.save(any(User.class))).thenAnswer(i -> {
        User u = i.getArgument(0);
        ReflectionTestUtils.setField(u, "id", testUserId);
        return u;
      });
      when(roles.findByName(RoleName.USER)).thenReturn(Optional.of(userRole));
      when(jwt.create(eq(testUserId), eq(List.of("USER")))).thenReturn("access-token-jwt");
      when(jwt.expiresIn()).thenReturn(3600L);
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      when(refresh.issue(any(User.class))).thenReturn(new RefreshTokenService.Issued("refresh-token-xyz", mockTokenEntity));

      // Act
      var result = authService.verifyOtpAndRegister(req);

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.refreshToken()).isEqualTo("refresh-token-xyz");
      assertThat(result.response().accessToken()).isEqualTo("access-token-jwt");
      assertThat(result.response().user().email()).isEqualTo("verify@example.com");
      verify(otpService).verifyOtp("verify@example.com", "123456");
      verify(userRoles).save(any(UserRole.class));
    }

    @Test
    @DisplayName("verifyOtpAndRegister throws EMAIL_ALREADY_EXISTS if email already in use")
    void verifyOtpAndRegister_EmailExists_ThrowsException() {
      // Arrange
      when(users.existsByEmailIgnoreCase("taken@example.com")).thenReturn(true);

      // Act & Assert
      assertThatThrownBy(() -> authService.verifyOtpAndRegister(new VerifyOtpRequest("taken@example.com", "123456", "Name", "Password123!")))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
          });
      verify(otpService, never()).verifyOtp(any(), any());
    }

    @Test
    @DisplayName("verifyOtpAndRegister propagates exception when OTP verification fails")
    void verifyOtpAndRegister_OtpVerificationFails_PropagatesException() {
      // Arrange
      when(users.existsByEmailIgnoreCase("verify@example.com")).thenReturn(false);
      when(otpService.verifyOtp("verify@example.com", "000000"))
          .thenThrow(new AuthException(ErrorCode.INVALID_CREDENTIALS, "Mã OTP không chính xác"));

      // Act & Assert
      assertThatThrownBy(() -> authService.verifyOtpAndRegister(new VerifyOtpRequest("verify@example.com", "000000", "Name", "Password123!")))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
          });
      verify(users, never()).save(any(User.class));
    }
  }

  @Nested
  @DisplayName("sendRegistrationOtp and getOtpDataResponse tests")
  class SendOtpTests {

    @Test
    @DisplayName("sendRegistrationOtp success calls otpService.sendOtp")
    void sendRegistrationOtp_Success() {
      // Arrange
      when(users.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
      when(otpService.sendOtp("new@example.com", "Nguyễn Văn A", "REGISTER")).thenReturn(300L);

      // Act
      long expiresIn = authService.sendRegistrationOtp(new SendOtpRequest(" New@example.com ", "Nguyễn Văn A", "REGISTER"));

      // Assert
      assertThat(expiresIn).isEqualTo(300L);
      verify(otpService).sendOtp("new@example.com", "Nguyễn Văn A", "REGISTER");
    }

    @Test
    @DisplayName("sendRegistrationOtp throws EMAIL_ALREADY_EXISTS if email already in use")
    void sendRegistrationOtp_EmailAlreadyExists() {
      // Arrange
      when(users.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

      // Act & Assert
      assertThatThrownBy(() -> authService.sendRegistrationOtp(new SendOtpRequest("existing@example.com", "Name", "REGISTER")))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
          });
      verify(otpService, never()).sendOtp(any(), any(), any());
    }

    @Test
    @DisplayName("getOtpDataResponse returns normalized email and seconds")
    void getOtpDataResponse_ReturnsExpectedMap() {
      var map = authService.getOtpDataResponse("  TEST@Example.com  ", 300L);
      assertThat(map.get("email")).isEqualTo("test@example.com");
      assertThat(map.get("expiresInSeconds")).isEqualTo(300L);
    }
  }

  @Nested
  @DisplayName("socialLogin tests")
  class SocialLoginTests {

    @Test
    @DisplayName("loginWithSocial with existing active user succeeds")
    void loginWithSocial_ExistingActiveUser_Success() {
      // Arrange
      when(users.findByEmailIgnoreCase("existing.social@aura.com")).thenReturn(Optional.of(testUser));
      var mockUserRole = new UserRole(testUser, userRole);
      when(userRoles.findAllByUserId(testUserId)).thenReturn(List.of(mockUserRole));
      when(jwt.create(eq(testUserId), eq(List.of("USER")))).thenReturn("jwt.social.token");
      when(jwt.expiresIn()).thenReturn(3600L);
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      when(refresh.issue(testUser)).thenReturn(new RefreshTokenService.Issued("social-refresh-token", mockTokenEntity));

      // Act
      var result = authService.loginWithSocial(new SocialLoginRequest("google", "valid.jwt.dummy", "existing.social@aura.com", "Nguyễn Văn A", "picture.jpg"));

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.refreshToken()).isEqualTo("social-refresh-token");
      assertThat(result.response().accessToken()).isEqualTo("jwt.social.token");
      assertThat(result.response().user().email()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("loginWithSocial with existing disabled user throws ACCOUNT_DISABLED")
    void loginWithSocial_ExistingDisabledUser_ThrowsAccountDisabled() {
      // Arrange
      testUser.setActive(false);
      when(users.findByEmailIgnoreCase("disabled.social@aura.com")).thenReturn(Optional.of(testUser));

      // Act & Assert
      assertThatThrownBy(() -> authService.loginWithSocial(
          new SocialLoginRequest("google", "token", "disabled.social@aura.com", "Name", null)))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.ACCOUNT_DISABLED);
          });
    }

    @Test
    @DisplayName("loginWithSocial with new user creates user and assigns USER role")
    void loginWithSocial_NewUser_CreatesAndAssignsUserRole() {
      // Arrange
      when(users.findByEmailIgnoreCase("new.social@aura.com")).thenReturn(Optional.empty());
      when(encoder.encode(any())).thenReturn("random_hash");
      when(users.save(any(User.class))).thenAnswer(i -> {
        User u = i.getArgument(0);
        ReflectionTestUtils.setField(u, "id", testUserId);
        return u;
      });
      when(roles.findByName(RoleName.USER)).thenReturn(Optional.of(userRole));
      when(userRoles.findAllByUserId(testUserId)).thenReturn(List.of(new UserRole(testUser, userRole)));
      when(jwt.create(eq(testUserId), eq(List.of("USER")))).thenReturn("jwt.social.token");
      when(jwt.expiresIn()).thenReturn(3600L);
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      when(refresh.issue(any(User.class))).thenReturn(new RefreshTokenService.Issued("social-refresh-token", mockTokenEntity));

      // Act
      var result = authService.loginWithSocial(new SocialLoginRequest("google", "token", "new.social@aura.com", "New Social User", null));

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.response().user().fullName()).isEqualTo("New Social User");
      verify(users).save(argThat(u -> u.isEmailVerified() && u.isActive()));
      verify(userRoles).save(any(UserRole.class));
    }

    @Test
    @DisplayName("loginWithSocial extracts email and name from valid JWT idToken payload")
    void loginWithSocial_ExtractsEmailFromIdToken() {
      // Arrange
      String jsonPayload = "{\"email\":\"jwt.extracted@aura.com\",\"name\":\"JWT Name\"}";
      String base64Payload = Base64.getUrlEncoder().withoutPadding().encodeToString(jsonPayload.getBytes(StandardCharsets.UTF_8));
      String fakeIdToken = "eyJhbGciOiJIUzI1NiJ9." + base64Payload + ".signature";

      when(users.findByEmailIgnoreCase("jwt.extracted@aura.com")).thenReturn(Optional.of(testUser));
      when(userRoles.findAllByUserId(testUserId)).thenReturn(List.of(new UserRole(testUser, userRole)));
      when(jwt.create(any(), any())).thenReturn("access-token");
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      when(refresh.issue(any())).thenReturn(new RefreshTokenService.Issued("rf-tok", mockTokenEntity));

      // Act
      var result = authService.loginWithSocial(new SocialLoginRequest("microsoft", fakeIdToken, null, null, null));

      // Assert
      assertThat(result).isNotNull();
      verify(users).findByEmailIgnoreCase("jwt.extracted@aura.com");
    }

    @Test
    @DisplayName("loginWithSocial throws INVALID_CREDENTIALS when no email found")
    void loginWithSocial_NoEmail_ThrowsInvalidCredentials() {
      // Arrange
      var request = new SocialLoginRequest("apple", "not-a-jwt", null, null, null);

      // Act & Assert
      assertThatThrownBy(() -> authService.loginWithSocial(request))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.INVALID_CREDENTIALS);
            assertThat(e.getMessage()).contains("Không thể trích xuất thông tin email");
          });
    }

    @Test
    @DisplayName("loginWithGoogle delegates to loginWithSocial")
    void loginWithGoogle_DelegatesToSocialLogin() {
      // Arrange
      when(users.findByEmailIgnoreCase("google.user@aura.com")).thenReturn(Optional.of(testUser));
      when(userRoles.findAllByUserId(testUserId)).thenReturn(List.of(new UserRole(testUser, userRole)));
      when(jwt.create(any(), any())).thenReturn("access-token");
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      when(refresh.issue(any())).thenReturn(new RefreshTokenService.Issued("rf-tok", mockTokenEntity));

      // Act
      var result = authService.loginWithGoogle(new GoogleLoginRequest("google-token", "google.user@aura.com", "Google User", "pic.jpg"));

      // Assert
      assertThat(result).isNotNull();
      verify(users).findByEmailIgnoreCase("google.user@aura.com");
    }
  }

  @Nested
  @DisplayName("refresh and logout tests")
  class RefreshAndLogoutTests {

    @Test
    @DisplayName("refresh rotates token and returns updated LoginResult")
    void refresh_Success() {
      // Arrange
      var mockTokenEntity = org.mockito.Mockito.mock(RefreshToken.class);
      var replacement = new RefreshTokenService.Issued("replacement-refresh-token", mockTokenEntity);
      var rotation = new RefreshTokenService.Rotation(testUser, replacement);
      when(refresh.rotate("old-refresh-token")).thenReturn(rotation);
      when(userRoles.findAllByUserId(testUserId)).thenReturn(List.of(new UserRole(testUser, userRole)));
      when(jwt.create(eq(testUserId), eq(List.of("USER")))).thenReturn("new-jwt-token");
      when(jwt.expiresIn()).thenReturn(3600L);

      // Act
      var result = authService.refresh("old-refresh-token");

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.refreshToken()).isEqualTo("replacement-refresh-token");
      assertThat(result.response().accessToken()).isEqualTo("new-jwt-token");
      verify(refresh).rotate("old-refresh-token");
    }

    @Test
    @DisplayName("logout with valid token calls refresh.revoke")
    void logout_WithToken_CallsRevoke() {
      // Act
      authService.logout("raw-token-to-revoke");

      // Assert
      verify(refresh).revoke("raw-token-to-revoke");
    }

    @Test
    @DisplayName("logout with null token does not call refresh.revoke")
    void logout_WithNull_DoesNotCallRevoke() {
      // Act
      authService.logout(null);

      // Assert
      verify(refresh, never()).revoke(any());
    }
  }

  @Nested
  @DisplayName("me tests")
  class MeTests {

    @Test
    @DisplayName("me returns user profile when user exists")
    void me_UserExists_ReturnsUserResponse() {
      // Arrange
      var principal = new AuraUserPrincipal(testUserId, "user@example.com", "pass", true, List.of("USER"));
      when(users.findById(testUserId)).thenReturn(Optional.of(testUser));

      // Act
      UserResponse res = authService.me(principal);

      // Assert
      assertThat(res).isNotNull();
      assertThat(res.id()).isEqualTo(testUserId);
      assertThat(res.email()).isEqualTo("user@example.com");
      assertThat(res.fullName()).isEqualTo("Nguyễn Văn A");
      assertThat(res.roles()).containsExactly("USER");
    }

    @Test
    @DisplayName("me throws NoSuchElementException when user not found in db")
    void me_UserNotFound_ThrowsException() {
      // Arrange
      var principal = new AuraUserPrincipal(testUserId, "user@example.com", "pass", true, List.of("USER"));
      when(users.findById(testUserId)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> authService.me(principal))
          .isInstanceOf(NoSuchElementException.class);
    }
  }
}
