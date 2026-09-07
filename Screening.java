package com.aura.screening.entity;

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
@Table(name = "screenings")
public class Screening {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "patient_id", nullable = false)
  private UUID patientId;

  @Column(name = "doctor_id")
  private UUID doctorId;

  @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
  private String imageUrl;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private ScreeningStatus status = ScreeningStatus.PENDING;

  @Enumerated(EnumType.STRING)
  @Column(name = "risk_level", length = 32)
  private RiskLevel riskLevel;

  @Column(name = "confidence")
  private Double confidence;

  @Column(name = "findings", columnDefinition = "TEXT")
  private String findings;

  @Column(name = "doctor_notes", columnDefinition = "TEXT")
  private String doctorNotes;

  @Column(name = "eye_position", length = 32)
  private String eyePosition;

  @Column(name = "scan_type", length = 64)
  private String scanType;

  @Column(name = "file_name", length = 255)
  private String fileName;

  @Column(name = "file_size")
  private Long fileSize;

  @Column(name = "mime_type", length = 100)
  private String mimeType;

  @Column(name = "risk_score")
  private Integer riskScore;

  @Column(name = "av_ratio")
  private Double avRatio;

  @Column(name = "vessel_density", length = 32)
  private String vesselDensity;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Screening() {}

  public Screening(UUID patientId, String imageUrl) {
    this.patientId = patientId;
    this.imageUrl = imageUrl;
    this.status = ScreeningStatus.PENDING;
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

  public UUID getPatientId() {
    return patientId;
  }

  public UUID getDoctorId() {
    return doctorId;
  }

  public void setDoctorId(UUID doctorId) {
    this.doctorId = doctorId;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public ScreeningStatus getStatus() {
    return status;
  }

  public void setStatus(ScreeningStatus status) {
    this.status = status;
  }

  public RiskLevel getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(RiskLevel riskLevel) {
    this.riskLevel = riskLevel;
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

  public String getDoctorNotes() {
    return doctorNotes;
  }

  public void setDoctorNotes(String doctorNotes) {
    this.doctorNotes = doctorNotes;
  }

  public String getEyePosition() {
    return eyePosition;
  }

  public void setEyePosition(String eyePosition) {
    this.eyePosition = eyePosition;
  }

  public String getScanType() {
    return scanType;
  }

  public void setScanType(String scanType) {
    this.scanType = scanType;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public Long getFileSize() {
    return fileSize;
  }

  public void setFileSize(Long fileSize) {
    this.fileSize = fileSize;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public Integer getRiskScore() {
    return riskScore;
  }

  public void setRiskScore(Integer riskScore) {
    this.riskScore = riskScore;
  }

  public Double getAvRatio() {
    return avRatio;
  }

  public void setAvRatio(Double avRatio) {
    this.avRatio = avRatio;
  }

  public String getVesselDensity() {
    return vesselDensity;
  }

  public void setVesselDensity(String vesselDensity) {
    this.vesselDensity = vesselDensity;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
