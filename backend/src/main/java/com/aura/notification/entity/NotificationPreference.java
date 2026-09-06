package com.aura.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_preference")
public class NotificationPreference {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "web_push", nullable = false)
  private boolean webPush = true;

  @Column(name = "email_enabled", nullable = false)
  private boolean emailEnabled = true;

  @Column(name = "sms_enabled", nullable = false)
  private boolean smsEnabled = false;

  @Column(name = "ai_ready", nullable = false)
  private boolean aiReady = true;

  @Column(name = "doctor_message", nullable = false)
  private boolean doctorMessage = true;

  @Column(name = "appointment_reminder", nullable = false)
  private boolean appointmentReminder = true;

  @Column(name = "low_credit", nullable = false)
  private boolean lowCredit = true;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected NotificationPreference() {}

  public NotificationPreference(UUID userId) {
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

  public boolean isWebPush() {
    return webPush;
  }

  public void setWebPush(boolean webPush) {
    this.webPush = webPush;
  }

  public boolean isEmailEnabled() {
    return emailEnabled;
  }

  public void setEmailEnabled(boolean emailEnabled) {
    this.emailEnabled = emailEnabled;
  }

  public boolean isSmsEnabled() {
    return smsEnabled;
  }

  public void setSmsEnabled(boolean smsEnabled) {
    this.smsEnabled = smsEnabled;
  }

  public boolean isAiReady() {
    return aiReady;
  }

  public void setAiReady(boolean aiReady) {
    this.aiReady = aiReady;
  }

  public boolean isDoctorMessage() {
    return doctorMessage;
  }

  public void setDoctorMessage(boolean doctorMessage) {
    this.doctorMessage = doctorMessage;
  }

  public boolean isAppointmentReminder() {
    return appointmentReminder;
  }

  public void setAppointmentReminder(boolean appointmentReminder) {
    this.appointmentReminder = appointmentReminder;
  }

  public boolean isLowCredit() {
    return lowCredit;
  }

  public void setLowCredit(boolean lowCredit) {
    this.lowCredit = lowCredit;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
