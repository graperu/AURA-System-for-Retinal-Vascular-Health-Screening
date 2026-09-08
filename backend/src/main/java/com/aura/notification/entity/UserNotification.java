package com.aura.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "user_notifications",
    indexes = {
      @Index(name = "idx_user_notif_user_id", columnList = "user_id"),
      @Index(name = "idx_user_notif_created_at", columnList = "created_at")
    })
public class UserNotification {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(nullable = false, length = 50)
  private String type; // AI_READY, DOCTOR_REVIEW, BILLING, SYSTEM, ALERT

  @Column(nullable = false, length = 30)
  private String severity; // INFO, SUCCESS, WARNING, CRITICAL

  @Column(name = "link_url", length = 300)
  private String linkUrl;

  @Column(name = "is_read", nullable = false)
  private boolean read = false;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected UserNotification() {}

  public UserNotification(
      UUID userId,
      String title,
      String message,
      String type,
      String severity,
      String linkUrl) {
    this.userId = userId;
    this.title = title;
    this.message = message;
    this.type = type;
    this.severity = severity != null ? severity : "INFO";
    this.linkUrl = linkUrl;
    this.read = false;
    this.createdAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getSeverity() {
    return severity;
  }

  public void setSeverity(String severity) {
    this.severity = severity;
  }

  public String getLinkUrl() {
    return linkUrl;
  }

  public void setLinkUrl(String linkUrl) {
    this.linkUrl = linkUrl;
  }

  public boolean isRead() {
    return read;
  }

  public void setRead(boolean read) {
    this.read = read;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
