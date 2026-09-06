package com.aura.privacy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "privacy_setting")
public class PrivacySetting {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "allow_anonymous_ai_training", nullable = false)
  private boolean allowAnonymousAiTraining = true;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected PrivacySetting() {}

  public PrivacySetting(UUID userId) {
    this.userId = userId;
  }

  @PrePersist
  @PreUpdate
  void touch() {
    updatedAt = Instant.now();
  }

  public UUID getUserId() {
    return userId;
  }

  public boolean isAllowAnonymousAiTraining() {
    return allowAnonymousAiTraining;
  }

  public void setAllowAnonymousAiTraining(boolean allowAnonymousAiTraining) {
    this.allowAnonymousAiTraining = allowAnonymousAiTraining;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
