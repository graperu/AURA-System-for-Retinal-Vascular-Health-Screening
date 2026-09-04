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

  public AuthService(
      UserRepository u,
      RoleRepository r,
      UserRoleRepository ur,
      PasswordEncoder e,
      AuthenticationManager a,
      JwtTokenProvider j,
      RefreshTokenService f,
      OtpService o) {
    users = u;
    roles = r;
    userRoles = ur;
    encoder = e;
    auth = a;
    jwt = j;
    refresh = f;
    otpService = o;
  }

  public long sendRegistrationOtp(SendOtpRequest q) {
    String email = q.email().trim().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(email)) {
      throw new AuthException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.");
    }
    return otpService.sendOtp(email, q.fullName(), "REGISTER");
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
    var role = roles.findByName(RoleName.USER).orElseThrow();
    userRoles.save(new UserRole(u, role));
    return view(u, List.of("USER"));
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
    String provider = q.provider() != null ? q.provider().trim().toLowerCase(Locale.ROOT) : "google";
    String email = null;
    String name = null;

    if (q.idToken() != null && q.idToken().contains(".")) {
      try {
        String[] parts = q.idToken().split("\\.");
        if (parts.length >= 2) {
          String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
          com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
          var node = mapper.readTree(payloadJson);
          if (node.has("email")) {
            email = node.get("email").asText().trim().toLowerCase(Locale.ROOT);
          }
          if (node.has("name")) {
            name = node.get("name").asText().trim();
          }
        }
      } catch (Exception ignored) {
      }
    }

    if (email == null && q.email() != null && !q.email().isBlank()) {
      email = q.email().trim().toLowerCase(Locale.ROOT);
    }
    if (name == null && q.fullName() != null && !q.fullName().isBlank()) {
      name = q.fullName().trim();
    }

    if (email == null || email.isBlank()) {
      throw new AuthException(ErrorCode.INVALID_CREDENTIALS, "Không thể trích xuất thông tin email từ tài khoản " + provider);
    }

    final String providerDisplayName = switch (provider) {
      case "microsoft" -> "Microsoft";
      case "apple" -> "Apple";
      case "facebook" -> "Facebook";
      case "github" -> "GitHub";
      default -> "Google";
    };

    final String finalName = name != null ? name : "Người dùng " + providerDisplayName;
    final String targetEmail = email;

    var user = users.findByEmailIgnoreCase(targetEmail).orElseGet(() -> {
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

    if ((user.getFullName() == null || user.getFullName().isBlank()) && name != null) {
      user.setFullName(name);
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

  public LoginResult refresh(String raw) {
    var r = refresh.rotate(raw);
    var names =
        userRoles.findAllByUserId(r.user().getId()).stream()
            .map(x -> x.getRole().getName().name())
            .toList();
    return result(r.user(), names, r.issued());
  }

  public void logout(String raw) {
    if (raw != null) refresh.revoke(raw);
  }

  public UserResponse me(AuraUserPrincipal p) {
    var u = users.findById(p.id()).orElseThrow();
    return view(u, p.roles());
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
