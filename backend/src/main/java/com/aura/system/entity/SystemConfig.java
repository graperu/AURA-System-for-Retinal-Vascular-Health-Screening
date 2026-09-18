package com.aura.system.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "system_configuration")
public class SystemConfig {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @Column(name = "config_key", nullable = false, unique = true, length = 100)
  private String configKey;

  @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
  private String configValue;

  @Column(name = "description", length = 255)
  private String description;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "updated_by", length = 100)
  private String updatedBy = "SYSTEM";

  public SystemConfig() {}

  public SystemConfig(String configKey, String configValue, String description, String updatedBy) {
    this.configKey = configKey;
    this.configValue = configValue;
    this.description = description;
    this.updatedBy = updatedBy != null ? updatedBy : "SYSTEM";
  }

  @PrePersist
  void onCreate() {
    if (updatedAt == null) {
      updatedAt = Instant.now();
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getConfigKey() {
    return configKey;
  }

  public void setConfigKey(String configKey) {
    this.configKey = configKey;
  }

  public String getConfigValue() {
    return configValue;
  }

  public void setConfigValue(String configValue) {
    this.configValue = configValue;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public String getUpdatedBy() {
    return updatedBy;
  }

  public void setUpdatedBy(String updatedBy) {
    this.updatedBy = updatedBy;
  }
}
