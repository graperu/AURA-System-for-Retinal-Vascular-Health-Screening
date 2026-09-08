package com.aura.notification.entity;

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
@Table(name = "communication_policies")
public class CommunicationPolicy {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "policy_key", nullable = false, unique = true, length = 64)
  private String policyKey = "DEFAULT";

  @Column(name = "email_enabled", nullable = false)
  private boolean emailEnabled = true;

  @Column(name = "in_app_enabled", nullable = false)
  private boolean inAppEnabled = true;

  @Column(name = "sms_enabled", nullable = false)
  private boolean smsEnabled;

  @Column(name = "high_risk_immediate", nullable = false)
  private boolean highRiskImmediate = true;

  @Column(name = "marketing_opt_in_default", nullable = false)
  private boolean marketingOptInDefault;

  @Column(name = "quiet_hours_start", length = 5)
  private String quietHoursStart;

  @Column(name = "quiet_hours_end", length = 5)
  private String quietHoursEnd;

  @Column(name = "retention_days", nullable = false)
  private int retentionDays = 365;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected CommunicationPolicy() {}

  public CommunicationPolicy(String policyKey) {
    this.policyKey = policyKey;
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

  public String getPolicyKey() {
    return policyKey;
  }

  public boolean isEmailEnabled() {
    return emailEnabled;
  }

  public void setEmailEnabled(boolean emailEnabled) {
    this.emailEnabled = emailEnabled;
  }

  public boolean isInAppEnabled() {
    return inAppEnabled;
  }

  public void setInAppEnabled(boolean inAppEnabled) {
    this.inAppEnabled = inAppEnabled;
  }

  public boolean isSmsEnabled() {
    return smsEnabled;
  }

  public void setSmsEnabled(boolean smsEnabled) {
    this.smsEnabled = smsEnabled;
  }

  public boolean isHighRiskImmediate() {
    return highRiskImmediate;
  }

  public void setHighRiskImmediate(boolean highRiskImmediate) {
    this.highRiskImmediate = highRiskImmediate;
  }

  public boolean isMarketingOptInDefault() {
    return marketingOptInDefault;
  }

  public void setMarketingOptInDefault(boolean marketingOptInDefault) {
    this.marketingOptInDefault = marketingOptInDefault;
  }

  public String getQuietHoursStart() {
    return quietHoursStart;
  }

  public void setQuietHoursStart(String quietHoursStart) {
    this.quietHoursStart = quietHoursStart;
  }

  public String getQuietHoursEnd() {
    return quietHoursEnd;
  }

  public void setQuietHoursEnd(String quietHoursEnd) {
    this.quietHoursEnd = quietHoursEnd;
  }

  public int getRetentionDays() {
    return retentionDays;
  }

  public void setRetentionDays(int retentionDays) {
    this.retentionDays = retentionDays;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
