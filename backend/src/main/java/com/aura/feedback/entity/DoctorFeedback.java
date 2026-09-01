package com.aura.feedback.entity;

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
@Table(name = "doctor_feedback")
public class DoctorFeedback {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "doctor_id", nullable = false)
  private UUID doctorId;

  @Column(name = "screening_id", nullable = false)
  private UUID screeningId;

  @Column(name = "ai_risk_level", nullable = false, length = 32)
  private String aiRiskLevel;

  @Column(name = "doctor_risk_level", nullable = false, length = 32)
  private String doctorRiskLevel;

  @Column(name = "is_accurate", nullable = false)
  private Boolean isAccurate;

  @Column(name = "feedback_notes", columnDefinition = "TEXT")
  private String feedbackNotes;

  @Column(name = "vessel_annotation_data", columnDefinition = "TEXT")
  private String vesselAnnotationData;

  @Column(name = "included_in_retraining", nullable = false)
  private Boolean includedInRetraining = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected DoctorFeedback() {}

  public DoctorFeedback(
      UUID doctorId,
      UUID screeningId,
      String aiRiskLevel,
      String doctorRiskLevel,
      Boolean isAccurate,
      String feedbackNotes,
      String vesselAnnotationData) {
    this.doctorId = doctorId;
    this.screeningId = screeningId;
    this.aiRiskLevel = aiRiskLevel;
    this.doctorRiskLevel = doctorRiskLevel;
    this.isAccurate = isAccurate;
    this.feedbackNotes = feedbackNotes;
    this.vesselAnnotationData = vesselAnnotationData;
    this.includedInRetraining = false;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getDoctorId() {
    return doctorId;
  }

  public UUID getScreeningId() {
    return screeningId;
  }

  public String getAiRiskLevel() {
    return aiRiskLevel;
  }

  public String getDoctorRiskLevel() {
    return doctorRiskLevel;
  }

  public Boolean getIsAccurate() {
    return isAccurate;
  }

  public String getFeedbackNotes() {
    return feedbackNotes;
  }

  public String getVesselAnnotationData() {
    return vesselAnnotationData;
  }

  public Boolean getIncludedInRetraining() {
    return includedInRetraining;
  }

  public void setIncludedInRetraining(Boolean includedInRetraining) {
    this.includedInRetraining = includedInRetraining;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
