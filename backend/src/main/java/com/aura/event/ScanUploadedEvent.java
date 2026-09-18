package com.aura.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

/**
 * Domain event dispatched when a patient uploads a retinal fundus scan.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScanUploadedEvent extends CrossPortalEvent {

  private static final long serialVersionUID = 1L;

  private UUID scanId;
  private UUID patientId;
  private String patientName;
  private String eye;
  private Double riskScore;

  public ScanUploadedEvent() {
    super("SCAN_UPLOADED", "PATIENT_PORTAL", "DOCTOR");
  }

  public ScanUploadedEvent(UUID scanId, UUID patientId, String patientName, String eye, Double riskScore) {
    super("SCAN_UPLOADED", "PATIENT_PORTAL", "DOCTOR");
    this.scanId = scanId;
    this.patientId = patientId;
    this.patientName = patientName;
    this.eye = eye;
    this.riskScore = riskScore;
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

  public String getPatientName() {
    return patientName;
  }

  public void setPatientName(String patientName) {
    this.patientName = patientName;
  }

  public String getEye() {
    return eye;
  }

  public void setEye(String eye) {
    this.eye = eye;
  }

  public Double getRiskScore() {
    return riskScore;
  }

  public void setRiskScore(Double riskScore) {
    this.riskScore = riskScore;
  }

  @Override
  public String toString() {
    return "ScanUploadedEvent{" +
        "eventId='" + getEventId() + '\'' +
        ", scanId=" + scanId +
        ", patientId=" + patientId +
        ", patientName='" + patientName + '\'' +
        ", eye='" + eye + '\'' +
        ", riskScore=" + riskScore +
        ", timestamp=" + getTimestamp() +
        '}';
  }
}
