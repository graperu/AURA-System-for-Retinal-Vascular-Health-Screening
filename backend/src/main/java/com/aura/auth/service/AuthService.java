package com.aura.auth.service;

import com.aura.auth.dto.*;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.*;
import com.aura.common.response.ErrorCode;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.user.entity.*;
import com.aura.user.repository.*;
import java.util.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository users;
  private final RoleRepository roles;
  private final UserRoleRepository userRoles;
  private final PasswordEncoder encoder;
  private final AuthenticationManager auth;
  private final JwtTokenProvider jwt;
  private final RefreshTokenService refresh;
  private final OtpService otpService;
  private final SocialTokenVerifier socialTokenVerifier;

  @org.springframework.beans.factory.annotation.Autowired
  public AuthService(
      UserRepository u,
      RoleRepository r,
      UserRoleRepository ur,
      PasswordEncoder e,
      AuthenticationManager a,
      JwtTokenProvider j,
      RefreshTokenService f,
      OtpService o,
      SocialTokenVerifier s) {
    users = u;
    roles = r;
    userRoles = ur;
    encoder = e;
    auth = a;
    jwt = j;
    refresh = f;
    otpService = o;
    socialTokenVerifier = s;
  }

  public AuthService(
      UserRepository u,
      RoleRepository r,
      UserRoleRepository ur,
      PasswordEncoder e,
      AuthenticationManager a,
      JwtTokenProvider j,
      RefreshTokenService f,
      OtpService o) {
    this(u, r, ur, e, a, j, f, o, new GoogleSocialTokenVerifier(new com.fasterxml.jackson.databind.ObjectMapper(), ""));
  }

  public long sendRegistrationOtp(SendOtpRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(email)) {
      throw new AuthException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.");
    }
    return otpService.sendOtp(email, q.fullName(), "REGISTER");
  }

  public long sendForgotPasswordOtp(ForgotPasswordRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    var userOpt = users.findByEmailIgnoreCase(email);
    if (userOpt.isEmpty()) {
      throw new AuthException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tài khoản với email này trong hệ thống.");
    }
    var user = userOpt.get();
    if (!user.isActive()) {
      throw new AuthException(ErrorCode.ACCOUNT_DISABLED, "Tài khoản của bạn hiện đang bị khóa hoặc vô hiệu hóa.");
    }
    return otpService.sendOtp(email, user.getFullName(), "FORGOT_PASSWORD");
  }

  @Transactional
  public LoginResult resetPassword(ResetPasswordRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    var user = users.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new AuthException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tài khoản với email này trong hệ thống."));

    if (!user.isActive()) {
      throw new AuthException(ErrorCode.ACCOUNT_DISABLED, "Tài khoản của bạn hiện đang bị khóa hoặc vô hiệu hóa.");
    }

    // Verify OTP code
    otpService.verifyOtp(email, q.otp());

    // Update password
    user.setPasswordHash(encoder.encode(q.newPassword()));
    user.setEmailVerified(true);
    var savedUser = users.save(user);

    // Invalidate old refresh tokens for security
    refresh.revokeAllUserTokens(savedUser.getId());

    var names = userRoles.findAllByUserId(savedUser.getId()).stream()
        .map(x -> x.getRole().getName().name())
        .toList();
    if (names.isEmpty()) {
      names = List.of("USER");
    }

    return result(savedUser, names);
  }

  public Map<String, Object> getOtpDataResponse(String rawEmail, long expiresIn) {
    String email = rawEmail.trim().toLowerCase(Locale.ROOT);
    Map<String, Object> map = new java.util.HashMap<>();
    map.put("email", email);
    map.put("expiresInSeconds", expiresIn);
    return map;
  }

  @Transactional
  public LoginResult verifyOtpAndRegister(VerifyOtpRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(email)) {
      throw new AuthException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng.");
    }

    // Verify OTP code
    otpService.verifyOtp(email, q.otp());

    var user = new User(
        email,
        encoder.encode(q.password()),
        q.fullName() == null ? null : q.fullName().trim()
    );
    user.setEmailVerified(true);
    var savedUser = users.save(user);

    var role = roles.findByName(RoleName.USER).orElseThrow();
    userRoles.save(new UserRole(savedUser, role));

    return result(savedUser, List.of("USER"));
  }

  @Transactional
  public UserResponse register(RegisterRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(email))
      throw new AuthException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng");
    var u =
        users.save(
            new User(
                email,
                encoder.encode(q.password()),
                q.fullName() == null ? null : q.fullName().trim()));
    RoleName requestedRole = "CLINIC".equals(q.role()) ? RoleName.CLINIC : RoleName.USER;
    var role = roles.findByName(requestedRole).orElseThrow();
    userRoles.save(new UserRole(u, role));
    return view(u, List.of(requestedRole.name()));
  }

  public LoginResult login(LoginRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    try {
      var a = auth.authenticate(new UsernamePasswordAuthenticationToken(email, q.password()));
      var p = (AuraUserPrincipal) a.getPrincipal();
      if (!p.enabled())
        throw new AuthException(ErrorCode.ACCOUNT_DISABLED, "Tài khoản đã bị vô hiệu hóa");
      var u = users.findById(p.id()).orElseThrow();
      return result(u, p.roles());
    } catch (DisabledException e) {
      throw new AuthException(ErrorCode.ACCOUNT_DISABLED, "Tài khoản đã bị vô hiệu hóa");
    } catch (AuthenticationException e) {
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, "Email hoặc mật khẩu không chính xác");
    }
  }

  @Transactional
  public LoginResult loginWithGoogle(GoogleLoginRequest q) {
    return loginWithSocial(new SocialLoginRequest("google", q.idToken(), q.email(), q.fullName(), q.picture()));
  }

  @Transactional
  public LoginResult loginWithSocial(SocialLoginRequest q) {
    if (q == null || q.idToken() == null || q.idToken().isBlank()) {
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, "ID Token không được để trống");
    }

    String provider = q.provider() != null ? q.provider().trim().toLowerCase(Locale.ROOT) : "google";

    // 1. Verify cryptographic token signature via SocialTokenVerifier
    var verifiedUser = socialTokenVerifier.verifyToken(provider, q.idToken());
    if (verifiedUser == null || verifiedUser.email() == null || verifiedUser.email().isBlank()) {
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS,
          "Token xác thực mạng xã hội (" + provider + ") không hợp lệ hoặc đã hết hạn");
    }

    // 2. Email is strictly sourced from verified token claims ONLY (NEVER from request body)
    final String targetEmail = verifiedUser.email().trim().toLowerCase(Locale.ROOT);
    final String rawName = (verifiedUser.name() != null && !verifiedUser.name().isBlank())
        ? verifiedUser.name().trim()
        : (q.fullName() != null && !q.fullName().isBlank())
            ? q.fullName().trim()
            : null;

    final String providerDisplayName = switch (provider) {
      case "microsoft" -> "Microsoft";
      case "apple" -> "Apple";
      case "facebook" -> "Facebook";
      case "github" -> "GitHub";
      default -> "Google";
    };

    final String finalName = (rawName != null && !rawName.isBlank())
        ? rawName
        : (targetEmail.contains("@") ? targetEmail.substring(0, targetEmail.indexOf('@')) : "Người dùng " + providerDisplayName);

    // 3. Defense-in-depth: Prevent Account Takeover of Admin / Doctor accounts
    var existingUserOpt = users.findByEmailIgnoreCase(targetEmail);
    if (existingUserOpt.isPresent()) {
      var existingUser = existingUserOpt.get();
      var userRoleEntities = userRoles.findAllByUserId(existingUser.getId());
      boolean isPrivileged = userRoleEntities.stream().anyMatch(ur ->
          ur.getRole().getName() == RoleName.ADMIN || ur.getRole().getName() == RoleName.DOCTOR
      );
      if (isPrivileged) {
        throw new AuthException(ErrorCode.ACCESS_DENIED,
            "Tài khoản Quản trị viên hoặc Bác sĩ không được phép đăng nhập qua mạng xã hội vì lý do an toàn y tế.");
      }
    }

    // 4. Load or create regular user
    var user = existingUserOpt.orElseGet(() -> {
      var newUser = new User(targetEmail, encoder.encode(UUID.randomUUID().toString()), finalName);
      newUser.setEmailVerified(true);
      newUser.setActive(true);
      var saved = users.save(newUser);
      var userRole = roles.findByName(RoleName.USER).orElseThrow();
      userRoles.save(new UserRole(saved, userRole));
      return saved;
    });

    if (!user.isActive()) {
      throw new AuthException(ErrorCode.ACCOUNT_DISABLED, "Tài khoản đã bị vô hiệu hóa");
    }

    if ((user.getFullName() == null || user.getFullName().isBlank()) && name != null && !name.isBlank()) {
      user.setFullName(name.trim());
      users.save(user);
    }

    var names = userRoles.findAllByUserId(user.getId()).stream()
        .map(x -> x.getRole().getName().name())
        .toList();
    if (names.isEmpty()) {
      names = List.of("USER");
    }

    return result(user, names);
  }

  @Transactional
  public LoginResult refresh(String raw) {
    var r = refresh.rotate(raw);
    var names =
        userRoles.findAllByUserIdWithRole(r.user().getId()).stream()
            .map(x -> x.getRole().getName().name())
            .toList();
    return result(r.user(), names, r.issued());
  }

  public void logout(String raw) {
    if (raw != null) refresh.revoke(raw);
  }

  @Transactional(readOnly = true)
  public UserResponse me(AuraUserPrincipal p) {
    var u = users.findById(p.id()).orElseThrow();
    var names =
        userRoles.findAllByUserIdWithRole(u.getId()).stream()
            .map(x -> x.getRole().getName().name())
            .toList();
    if (names.isEmpty()) {
      names = p.roles();
    }
    return view(u, names);
  }

  private LoginResult result(com.aura.user.entity.User u, List<String> names) {
    return result(u, names, refresh.issue(u));
  }

  private LoginResult result(
      com.aura.user.entity.User u, List<String> names, RefreshTokenService.Issued issued) {
    return new LoginResult(
        new LoginResponse(jwt.create(u.getId(), names), "Bearer", jwt.expiresIn(), view(u, names)),
        issued.raw());
  }

  private UserResponse view(com.aura.user.entity.User u, List<String> names) {
    return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), names, u.isActive());
  }

  public record LoginResult(LoginResponse response, String refreshToken) {}
}
