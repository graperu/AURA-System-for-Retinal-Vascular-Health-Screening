package com.aura.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "notification")
public class AppNotification {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 64)
  private NotificationType type;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String body;

  @Column(nullable = false, length = 128)
  private String channels;

  @Column(name = "is_read", nullable = false)
  private boolean read;

  @Column(nullable = false)
  private boolean critical;

  @Column(name = "related_resource_id", length = 128)
  private String relatedResourceId;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected AppNotification() {}

  public AppNotification(
      UUID userId,
      NotificationType type,
      String title,
      String body,
      String channels,
      boolean critical,
      String relatedResourceId) {
    this.userId = userId;
    this.type = type;
    this.title = title;
    this.body = body;
    this.channels = channels;
    this.critical = critical;
    this.relatedResourceId = relatedResourceId;
  }

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public NotificationType getType() {
    return type;
  }

  public String getTitle() {
    return title;
  }

  public String getBody() {
    return body;
  }

  public String getChannels() {
    return channels;
  }

  public boolean isRead() {
    return read;
  }

  public void markRead() {
    this.read = true;
  }

  public boolean isCritical() {
    return critical;
  }

  public String getRelatedResourceId() {
    return relatedResourceId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
