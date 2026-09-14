package com.aura.audit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "user_email", length = 320)
  private String userEmail;

  @Column(name = "user_role", length = 50)
  private String userRole;

  @Column(name = "module", length = 64)
  private String module;

  @Column(name = "action", nullable = false, length = 64)
  private String action;

  @Column(name = "resource_type", nullable = false, length = 64)
  private String resourceType;

  @Column(name = "resource_id", length = 128)
  private String resourceId;

  @Column(name = "ip_address", length = 45)
  private String ipAddress;

  @Column(name = "user_agent", length = 255)
  private String userAgent;

  @Column(name = "status", nullable = false, length = 32)
  private String status = "SUCCESS";

  @Column(name = "details", columnDefinition = "TEXT")
  private String details;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected AuditLog() {}

  public AuditLog(
      UUID userId,
      String userEmail,
      String userRole,
      String module,
      String action,
      String resourceType,
      String resourceId,
      String ipAddress,
      String userAgent,
      String status,
      String details) {
    this.userId = userId;
    this.userEmail = userEmail;
    this.userRole = userRole;
    this.module = module;
    this.action = action;
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.status = status != null ? status : "SUCCESS";
    this.details = details;
  }

  public AuditLog(
      UUID userId,
      String userEmail,
      String action,
      String resourceType,
      String resourceId,
      String ipAddress,
      String userAgent,
      String status,
      String details) {
    this(userId, userEmail, null, null, action, resourceType, resourceId, ipAddress, userAgent, status, details);
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

  public String getUserEmail() {
    return userEmail;
  }

  public String getUserRole() {
    return userRole;
  }

  public String getModule() {
    return module;
  }

  public String getAction() {
    return action;
  }

  public String getResourceType() {
    return resourceType;
  }

  public String getResourceId() {
    return resourceId;
  }

  public String getIpAddress() {
    return ipAddress;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public String getStatus() {
    return status;
  }

  public String getDetails() {
    return details;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
