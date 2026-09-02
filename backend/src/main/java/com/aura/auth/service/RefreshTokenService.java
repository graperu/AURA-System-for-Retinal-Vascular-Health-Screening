package com.aura.auth.service;

import com.aura.auth.config.AuthProperties;
import com.aura.auth.entity.RefreshToken;
import com.aura.auth.exception.AuthException;
import com.aura.auth.repository.RefreshTokenRepository;
import com.aura.common.response.ErrorCode;
import com.aura.user.entity.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {
  private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
  private final RefreshTokenRepository repository;
  private final AuthProperties properties;
  private final SecureRandom random = new SecureRandom();

  public RefreshTokenService(RefreshTokenRepository repository, AuthProperties properties) {
    this.repository = repository;
    this.properties = properties;
  }

  public Issued issue(User user) {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    RefreshToken entity =
        repository.save(
            new RefreshToken(
                user,
                hash(raw),
                Instant.now().plus(properties.refreshTokenDays(), ChronoUnit.DAYS)));
    return new Issued(raw, entity);
  }

  @Transactional(noRollbackFor = AuthException.class)
  public Rotation rotate(String raw) {
    RefreshToken old =
        repository
            .findByTokenHashForUpdate(hash(raw))
            .orElseThrow(
                () -> invalid(ErrorCode.REFRESH_TOKEN_INVALID, "Refresh token không hợp lệ"));
    if (old.getRevokedAt() != null) {
      repository.revokeAllActiveByUserId(old.getUser().getId(), Instant.now());
      log.warn("Refresh token reuse detected for userId={}", old.getUser().getId());
      throw invalid(ErrorCode.REFRESH_TOKEN_REVOKED, "Refresh token đã bị thu hồi");
    }
    if (!old.usable()) {
      throw invalid(ErrorCode.REFRESH_TOKEN_INVALID, "Refresh token không hợp lệ");
    }
    Issued replacement = issue(old.getUser());
    old.revoke(replacement.entity());
    return new Rotation(old.getUser(), replacement);
  }

  @Transactional
  public void revoke(String raw) {
    repository
        .findByTokenHashForUpdate(hash(raw))
        .filter(token -> token.getRevokedAt() == null)
        .ifPresent(token -> token.revoke(null));
  }

  private AuthException invalid(ErrorCode code, String message) {
    return new AuthException(code, message);
  }

  private String hash(String raw) {
    try {
      return Base64.getEncoder()
          .encodeToString(
              MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(exception);
    }
  }

  public record Issued(String raw, RefreshToken entity) {}

  public record Rotation(User user, Issued issued) {}
}
