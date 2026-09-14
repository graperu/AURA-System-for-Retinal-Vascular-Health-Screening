package com.aura.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.config.AuthProperties;
import com.aura.auth.entity.RefreshToken;
import com.aura.auth.exception.AuthException;
import com.aura.auth.repository.RefreshTokenRepository;
import com.aura.common.response.ErrorCode;
import com.aura.user.entity.User;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

  @Mock private RefreshTokenRepository repository;
  @Mock private AuthProperties properties;

  @InjectMocks private RefreshTokenService service;

  private User testUser;
  private UUID testUserId;

  @BeforeEach
  void setUp() {
    testUserId = UUID.randomUUID();
    testUser = new User("user@aura.com", "hash", "Nguyễn Văn A");
    ReflectionTestUtils.setField(testUser, "id", testUserId);
    testUser.setActive(true);
  }

  @Nested
  @DisplayName("issue tests")
  class IssueTests {

    @Test
    @DisplayName("issue creates and saves RefreshToken with configured validity days")
    void issue_Success() {
      // Arrange
      when(properties.refreshTokenDays()).thenReturn(14L);
      when(repository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

      // Act
      var issued = service.issue(testUser);

      // Assert
      assertThat(issued).isNotNull();
      assertThat(issued.raw()).isNotBlank();
      assertThat(issued.entity()).isNotNull();
      assertThat(issued.entity().getUser()).isEqualTo(testUser);
      assertThat(issued.entity().getExpiresAt()).isAfter(Instant.now().plus(13, ChronoUnit.DAYS));
      verify(repository).save(any(RefreshToken.class));
    }
  }

  @Nested
  @DisplayName("rotate tests")
  class RotateTests {

    @Test
    @DisplayName("rotate active token replaces old token with new one and revokes old")
    void rotate_ActiveToken_Success() {
      // Arrange
      RefreshToken oldToken = new RefreshToken(
          testUser,
          "old-hash",
          Instant.now().plus(7, ChronoUnit.DAYS)
      );

      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(oldToken));
      when(properties.refreshTokenDays()).thenReturn(14L);
      when(repository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

      // Act
      var rotation = service.rotate("valid-raw-token");

      // Assert
      assertThat(rotation).isNotNull();
      assertThat(rotation.user()).isEqualTo(testUser);
      assertThat(rotation.issued().raw()).isNotBlank();
      assertThat(oldToken.getRevokedAt()).isNotNull();
      verify(repository).save(argThat(token -> token.getUser().equals(testUser)));
    }

    @Test
    @DisplayName("rotate not found token throws REFRESH_TOKEN_INVALID")
    void rotate_TokenNotFound_ThrowsInvalid() {
      // Arrange
      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> service.rotate("unknown-raw-token"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.REFRESH_TOKEN_INVALID);
            assertThat(e.getMessage()).contains("Refresh token không hợp lệ");
          });
    }

    @Test
    @DisplayName("rotate already revoked token triggers reuse detection and revokes all active tokens")
    void rotate_RevokedToken_TriggersReuseDetection() {
      // Arrange
      RefreshToken revokedToken = new RefreshToken(
          testUser,
          "revoked-hash",
          Instant.now().plus(7, ChronoUnit.DAYS)
      );
      ReflectionTestUtils.setField(revokedToken, "revokedAt", Instant.now().minus(1, ChronoUnit.HOURS));

      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(revokedToken));

      // Act & Assert
      assertThatThrownBy(() -> service.rotate("reused-raw-token"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.REFRESH_TOKEN_REVOKED);
            assertThat(e.getMessage()).contains("Refresh token đã bị thu hồi");
          });

      verify(repository).revokeAllActiveByUserId(eq(testUserId), any(Instant.class));
    }

    @Test
    @DisplayName("rotate expired token throws REFRESH_TOKEN_INVALID")
    void rotate_ExpiredToken_ThrowsInvalid() {
      // Arrange
      RefreshToken expiredToken = new RefreshToken(
          testUser,
          "expired-hash",
          Instant.now().minusSeconds(120)
      );
      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(expiredToken));

      // Act & Assert
      assertThatThrownBy(() -> service.rotate("expired-raw-token"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.REFRESH_TOKEN_INVALID);
          });
    }

    @Test
    @DisplayName("rotate token for inactive user throws REFRESH_TOKEN_INVALID")
    void rotate_InactiveUser_ThrowsInvalid() {
      // Arrange
      testUser.setActive(false);
      RefreshToken tokenWithInactiveUser = new RefreshToken(
          testUser,
          "inactive-user-hash",
          Instant.now().plus(7, ChronoUnit.DAYS)
      );
      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(tokenWithInactiveUser));

      // Act & Assert
      assertThatThrownBy(() -> service.rotate("inactive-user-token"))
          .isInstanceOfSatisfying(AuthException.class, e -> {
            assertThat(e.code()).isEqualTo(ErrorCode.REFRESH_TOKEN_INVALID);
          });
    }
  }

  @Nested
  @DisplayName("revoke tests")
  class RevokeTests {

    @Test
    @DisplayName("revoke active token sets revokedAt timestamp")
    void revoke_ActiveToken_SetsRevokedAt() {
      // Arrange
      RefreshToken activeToken = new RefreshToken(
          testUser,
          "active-hash",
          Instant.now().plus(7, ChronoUnit.DAYS)
      );
      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(activeToken));

      // Act
      service.revoke("raw-token-to-revoke");

      // Assert
      assertThat(activeToken.getRevokedAt()).isNotNull();
    }

    @Test
    @DisplayName("revoke already revoked token leaves original revokedAt unchanged")
    void revoke_AlreadyRevokedToken_NoChange() {
      // Arrange
      Instant originalRevokedAt = Instant.now().minus(2, ChronoUnit.HOURS);
      RefreshToken revokedToken = new RefreshToken(
          testUser,
          "already-revoked-hash",
          Instant.now().plus(7, ChronoUnit.DAYS)
      );
      ReflectionTestUtils.setField(revokedToken, "revokedAt", originalRevokedAt);

      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(revokedToken));

      // Act
      service.revoke("already-revoked-raw");

      // Assert
      assertThat(revokedToken.getRevokedAt()).isEqualTo(originalRevokedAt);
    }

    @Test
    @DisplayName("revoke non-existent token completes silently")
    void revoke_NonExistentToken_SilentlyCompletes() {
      // Arrange
      when(repository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.empty());

      // Act
      service.revoke("non-existent-token");

      // Assert
      verify(repository, never()).save(any());
    }
  }
}
