package com.aura.bulk.entity;

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
@Table(name = "bulk_screening_items")
public class BulkScreeningItem {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @Column(name = "batch_id", nullable = false)
  private UUID batchId;

  @Column(name = "item_code", length = 100)
  private String itemCode;

  @Column(name = "file_name", length = 255)
  private String fileName;

  @Column(name = "eye_position", length = 32)
  private String eyePosition;

  @Column(name = "pseudonym_patient_id", length = 128)
  private String pseudonymPatientId;

  @Column(name = "patient_name", length = 150)
  private String patientName;

  @Column(name = "raw_mrn", length = 64)
  private String rawMrn;

  @Column(name = "patient_age")
  private Integer patientAge;

  @Column(name = "patient_gender", length = 16)
  private String patientGender;

  @Column(name = "systolic_bp")
  private Integer systolicBp;

  @Column(name = "diastolic_bp")
  private Integer diastolicBp;

  @Column(name = "hba1c", columnDefinition = "numeric(4,2)")
  private Double hba1c;

  @Column(name = "status", nullable = false, length = 32)
  private String status = "QUEUED";

  @Column(name = "duration_ms")
  private Long durationMs = 0L;

  @Column(name = "risk_level", length = 32)
  private String riskLevel;

  @Column(name = "risk_score")
  private Integer riskScore;

  @Column(name = "confidence")
  private Double confidence;

  @Column(name = "findings", columnDefinition = "TEXT")
  private String findings;

  @Column(name = "error_message", columnDefinition = "TEXT")
  private String errorMessage;

  @Column(name = "processed_at")
  private Instant processedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public BulkScreeningItem() {}

  public BulkScreeningItem(
      UUID batchId,
      String itemCode,
      String fileName,
      String eyePosition,
      String pseudonymPatientId) {
    this.batchId = batchId;
    this.itemCode = itemCode;
    this.fileName = fileName;
    this.eyePosition = eyePosition;
    this.pseudonymPatientId = pseudonymPatientId;
    this.status = "QUEUED";
    this.durationMs = 0L;
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

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getBatchId() {
    return batchId;
  }

  public void setBatchId(UUID batchId) {
    this.batchId = batchId;
  }

  public String getItemCode() {
    return itemCode;
  }

  public void setItemCode(String itemCode) {
    this.itemCode = itemCode;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getEyePosition() {
    return eyePosition;
  }

  public void setEyePosition(String eyePosition) {
    this.eyePosition = eyePosition;
  }

  public String getPseudonymPatientId() {
    return pseudonymPatientId;
  }

  public void setPseudonymPatientId(String pseudonymPatientId) {
    this.pseudonymPatientId = pseudonymPatientId;
  }

  public String getPatientName() {
    return patientName;
  }

  public void setPatientName(String patientName) {
    this.patientName = patientName;
  }

  public String getRawMrn() {
    return rawMrn;
  }

  public void setRawMrn(String rawMrn) {
    this.rawMrn = rawMrn;
  }

  public Integer getPatientAge() {
    return patientAge;
  }

  public void setPatientAge(Integer patientAge) {
    this.patientAge = patientAge;
  }

  public String getPatientGender() {
    return patientGender;
  }

  public void setPatientGender(String patientGender) {
    this.patientGender = patientGender;
  }

  public Integer getSystolicBp() {
    return systolicBp;
  }

  public void setSystolicBp(Integer systolicBp) {
    this.systolicBp = systolicBp;
  }

  public Integer getDiastolicBp() {
    return diastolicBp;
  }

  public void setDiastolicBp(Integer diastolicBp) {
    this.diastolicBp = diastolicBp;
  }

  public Double getHba1c() {
    return hba1c;
  }

  public void setHba1c(Double hba1c) {
    this.hba1c = hba1c;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Long getDurationMs() {
    return durationMs;
  }

  public void setDurationMs(Long durationMs) {
    this.durationMs = durationMs;
  }

  public String getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(String riskLevel) {
    this.riskLevel = riskLevel;
  }

  public Integer getRiskScore() {
    return riskScore;
  }

  public void setRiskScore(Integer riskScore) {
    this.riskScore = riskScore;
  }

  public Double getConfidence() {
    return confidence;
  }

  public void setConfidence(Double confidence) {
    this.confidence = confidence;
  }

  public String getFindings() {
    return findings;
  }

  public void setFindings(String findings) {
    this.findings = findings;
  }

  public String getErrorMessage() {
    return errorMessage;
  }

  public void setErrorMessage(String errorMessage) {
    this.errorMessage = errorMessage;
  }

  public Instant getProcessedAt() {
    return processedAt;
  }

  public void setProcessedAt(Instant processedAt) {
    this.processedAt = processedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
