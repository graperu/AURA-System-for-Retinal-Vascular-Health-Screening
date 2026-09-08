package com.aura.role.entity;

import com.aura.role.enums.RoleName;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "role_permissions")
public class RolePermission {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Enumerated(EnumType.STRING)
  @Column(name = "role_name", nullable = false, length = 50)
  private RoleName roleName;

  @Column(name = "permission_code", nullable = false, length = 80)
  private String permissionCode;

  @Column(name = "permission_label", nullable = false, length = 255)
  private String permissionLabel;

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected RolePermission() {}

  public RolePermission(RoleName roleName, String permissionCode, String permissionLabel, boolean enabled) {
    this.roleName = roleName;
    this.permissionCode = permissionCode;
    this.permissionLabel = permissionLabel;
    this.enabled = enabled;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    if (updatedAt == null) updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public RoleName getRoleName() {
    return roleName;
  }

  public String getPermissionCode() {
    return permissionCode;
  }

  public String getPermissionLabel() {
    return permissionLabel;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
