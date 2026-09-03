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

  @Column(name = "image_url", nullable = false, length = 512)
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

  // --- FR-3: per-category risk breakdown ---
  @Column(name = "cardiovascular_risk_score")
  private Integer cardiovascularRiskScore;

  @Column(name = "cardiovascular_risk_level", length = 32)
  private String cardiovascularRiskLevel;

  @Column(name = "diabetic_retinopathy_risk_score")
  private Integer diabeticRetinopathyRiskScore;

  @Column(name = "diabetic_retinopathy_risk_level", length = 32)
  private String diabeticRetinopathyRiskLevel;

  @Column(name = "hypertension_risk_score")
  private Integer hypertensionRiskScore;

  @Column(name = "hypertension_risk_level", length = 32)
  private String hypertensionRiskLevel;

  @Column(name = "stroke_risk_score")
  private Integer strokeRiskScore;

  @Column(name = "stroke_risk_level", length = 32)
  private String strokeRiskLevel;

  // --- FR-3 / FR-4: retinal vascular biomarkers ---
  @Column(name = "av_ratio")
  private Double avRatio;

  @Column(name = "vessel_density_percent")
  private Double vesselDensityPercent;

  @Column(name = "tortuosity_index")
  private Double tortuosityIndex;

  @Column(name = "vertical_cdr")
  private Double verticalCdr;

  // --- FR-4: Grad-CAM heatmap overlay ---
  @Column(name = "heatmap_base64", columnDefinition = "TEXT")
  private String heatmapBase64;

  // --- FR-5: auto-generated health recommendations ---
  @Column(name = "recommendations", columnDefinition = "TEXT")
  private String recommendations;
  @Column(name = "doctor_notes", columnDefinition = "TEXT")
  private String doctorNotes;

  @Enumerated(EnumType.STRING)
  @Column(name = "review_decision", length = 16)
  private ReviewDecision reviewDecision;

  @Enumerated(EnumType.STRING)
  @Column(name = "original_ai_risk_level", length = 32)
  private RiskLevel originalAiRiskLevel;

  @Enumerated(EnumType.STRING)
  @Column(name = "doctor_cardiovascular_risk_level", length = 32)
  private RiskLevel doctorCardiovascularRiskLevel;

  @Enumerated(EnumType.STRING)
  @Column(name = "doctor_diabetic_retinopathy_risk_level", length = 32)
  private RiskLevel doctorDiabeticRetinopathyRiskLevel;

  @Column(name = "icd10_codes", columnDefinition = "TEXT")
  private String icd10Codes;

  @Column(name = "digital_signature", columnDefinition = "TEXT")
  private String digitalSignature;

  @Column(name = "signed_at")
  private Instant signedAt;

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

  public Integer getCardiovascularRiskScore() {
    return cardiovascularRiskScore;
  }

  public void setCardiovascularRiskScore(Integer cardiovascularRiskScore) {
    this.cardiovascularRiskScore = cardiovascularRiskScore;
  }

  public String getCardiovascularRiskLevel() {
    return cardiovascularRiskLevel;
  }

  public void setCardiovascularRiskLevel(String cardiovascularRiskLevel) {
    this.cardiovascularRiskLevel = cardiovascularRiskLevel;
  }

  public Integer getDiabeticRetinopathyRiskScore() {
    return diabeticRetinopathyRiskScore;
  }

  public void setDiabeticRetinopathyRiskScore(Integer diabeticRetinopathyRiskScore) {
    this.diabeticRetinopathyRiskScore = diabeticRetinopathyRiskScore;
  }

  public String getDiabeticRetinopathyRiskLevel() {
    return diabeticRetinopathyRiskLevel;
  }

  public void setDiabeticRetinopathyRiskLevel(String diabeticRetinopathyRiskLevel) {
    this.diabeticRetinopathyRiskLevel = diabeticRetinopathyRiskLevel;
  }

  public Integer getHypertensionRiskScore() {
    return hypertensionRiskScore;
  }

  public void setHypertensionRiskScore(Integer hypertensionRiskScore) {
    this.hypertensionRiskScore = hypertensionRiskScore;
  }

  public String getHypertensionRiskLevel() {
    return hypertensionRiskLevel;
  }

  public void setHypertensionRiskLevel(String hypertensionRiskLevel) {
    this.hypertensionRiskLevel = hypertensionRiskLevel;
  }

  public Integer getStrokeRiskScore() {
    return strokeRiskScore;
  }

  public void setStrokeRiskScore(Integer strokeRiskScore) {
    this.strokeRiskScore = strokeRiskScore;
  }

  public String getStrokeRiskLevel() {
    return strokeRiskLevel;
  }

  public void setStrokeRiskLevel(String strokeRiskLevel) {
    this.strokeRiskLevel = strokeRiskLevel;
  }

  public Double getAvRatio() {
    return avRatio;
  }

  public void setAvRatio(Double avRatio) {
    this.avRatio = avRatio;
  }

  public Double getVesselDensityPercent() {
    return vesselDensityPercent;
  }

  public void setVesselDensityPercent(Double vesselDensityPercent) {
    this.vesselDensityPercent = vesselDensityPercent;
  }

  public Double getTortuosityIndex() {
    return tortuosityIndex;
  }

  public void setTortuosityIndex(Double tortuosityIndex) {
    this.tortuosityIndex = tortuosityIndex;
  }

  public Double getVerticalCdr() {
    return verticalCdr;
  }

  public void setVerticalCdr(Double verticalCdr) {
    this.verticalCdr = verticalCdr;
  }

  public String getHeatmapBase64() {
    return heatmapBase64;
  }

  public void setHeatmapBase64(String heatmapBase64) {
    this.heatmapBase64 = heatmapBase64;
  }

  public String getRecommendations() {
    return recommendations;
  }

  public void setRecommendations(String recommendations) {
    this.recommendations = recommendations;
  }
  public String getDoctorNotes() {
    return doctorNotes;
  }

  public void setDoctorNotes(String doctorNotes) {
    this.doctorNotes = doctorNotes;
  }

  public ReviewDecision getReviewDecision() {
    return reviewDecision;
  }

  public void setReviewDecision(ReviewDecision reviewDecision) {
    this.reviewDecision = reviewDecision;
  }

  public RiskLevel getOriginalAiRiskLevel() {
    return originalAiRiskLevel;
  }

  public void setOriginalAiRiskLevel(RiskLevel originalAiRiskLevel) {
    this.originalAiRiskLevel = originalAiRiskLevel;
  }

  public RiskLevel getDoctorCardiovascularRiskLevel() {
    return doctorCardiovascularRiskLevel;
  }

  public void setDoctorCardiovascularRiskLevel(RiskLevel doctorCardiovascularRiskLevel) {
    this.doctorCardiovascularRiskLevel = doctorCardiovascularRiskLevel;
  }

  public RiskLevel getDoctorDiabeticRetinopathyRiskLevel() {
    return doctorDiabeticRetinopathyRiskLevel;
  }

  public void setDoctorDiabeticRetinopathyRiskLevel(RiskLevel doctorDiabeticRetinopathyRiskLevel) {
    this.doctorDiabeticRetinopathyRiskLevel = doctorDiabeticRetinopathyRiskLevel;
  }

  public String getIcd10Codes() {
    return icd10Codes;
  }

  public void setIcd10Codes(String icd10Codes) {
    this.icd10Codes = icd10Codes;
  }

  public String getDigitalSignature() {
    return digitalSignature;
  }

  public void setDigitalSignature(String digitalSignature) {
    this.digitalSignature = digitalSignature;
  }

  public Instant getSignedAt() {
    return signedAt;
  }

  public void setSignedAt(Instant signedAt) {
    this.signedAt = signedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
