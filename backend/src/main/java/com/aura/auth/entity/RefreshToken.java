package com.aura.auth.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
  @Id @GeneratedValue @UuidGenerator private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "token_hash", nullable = false, unique = true, length = 255)
  private String tokenHash;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "replaced_by_token_id")
  private RefreshToken replacedBy;

  protected RefreshToken() {}

  public RefreshToken(User user, String hash, Instant expiresAt) {
    this.user = user;
    this.tokenHash = hash;
    this.expiresAt = expiresAt;
  }

  @PrePersist
  void create() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public User getUser() {
    return user;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getRevokedAt() {
    return revokedAt;
  }

  public boolean usable() {
    return revokedAt == null && expiresAt.isAfter(Instant.now()) && user.isActive();
  }

  public void revoke(RefreshToken replacement) {
    this.revokedAt = Instant.now();
    this.replacedBy = replacement;
  }
}
