package com.aura.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

/**
 * Domain event dispatched when a doctor completes a clinical review or override on a retinal screening.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClinicalReviewEvent extends CrossPortalEvent {

  private static final long serialVersionUID = 1L;

  private UUID reviewId;
  private UUID scanId;
  private UUID patientId;
  private String doctorName;
  private String status;
  private String notes;

  public ClinicalReviewEvent() {
    super("CLINICAL_REVIEW", "DOCTOR_PORTAL", "PATIENT");
  }

  public ClinicalReviewEvent(UUID reviewId, UUID scanId, String doctorName, String status, String notes) {
    super("CLINICAL_REVIEW", "DOCTOR_PORTAL", "PATIENT");
    this.reviewId = reviewId;
    this.scanId = scanId;
    this.doctorName = doctorName;
    this.status = status;
    this.notes = notes;
  }

  public ClinicalReviewEvent(UUID reviewId, UUID scanId, UUID patientId, String doctorName, String status, String notes) {
    this(reviewId, scanId, doctorName, status, notes);
    this.patientId = patientId;
  }

  public UUID getReviewId() {
    return reviewId;
  }

  public void setReviewId(UUID reviewId) {
    this.reviewId = reviewId;
  }

  public UUID getScanId() {
    return scanId;
  }

  public void setScanId(UUID scanId) {
    this.scanId = scanId;
  }

  public UUID getPatientId() {
    return patientId;
  }

  public void setPatientId(UUID patientId) {
    this.patientId = patientId;
  }

  public String getDoctorName() {
    return doctorName;
  }

  public void setDoctorName(String doctorName) {
    this.doctorName = doctorName;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  @Override
  public String toString() {
    return "ClinicalReviewEvent{" +
        "eventId='" + getEventId() + '\'' +
        ", reviewId=" + reviewId +
        ", scanId=" + scanId +
        ", patientId=" + patientId +
        ", doctorName='" + doctorName + '\'' +
        ", status='" + status + '\'' +
        ", timestamp=" + getTimestamp() +
        '}';
  }
}
