package com.aura.patient.entity;

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
@Table(name = "patient_profiles")
public class PatientProfile {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "mrn", nullable = false, unique = true, length = 64)
  private String mrn;

  @Column(name = "full_name", nullable = false, length = 150)
  private String fullName;

  @Column(name = "age")
  private Integer age;

  @Column(name = "gender", length = 20)
  private String gender = "Other";

  @Column(name = "phone", length = 50)
  private String phone;

  @Column(name = "address", length = 255)
  private String address;

  @Column(name = "systolic_bp")
  private Integer systolicBp = 120;

  @Column(name = "diastolic_bp")
  private Integer diastolicBp = 80;

  @Column(name = "hba1c")
  private Double hba1c = 5.7;

  @Column(name = "has_diabetes")
  private Boolean hasDiabetes = false;

  @Column(name = "has_hypertension")
  private Boolean hasHypertension = false;

  @Column(name = "history_of_smoking")
  private Boolean historyOfSmoking = false;

  @Column(name = "last_exam_date", length = 32)
  private String lastExamDate;

  @Column(name = "assigned_doctor", length = 150)
  private String assignedDoctor = "BS. CKII Nguyễn Thị Thanh";

  @Column(name = "risk_score")
  private Integer riskScore = 25;

  @Column(name = "risk_level", length = 32)
  private String riskLevel = "LOW";

  @Column(name = "review_status", length = 32)
  private String reviewStatus = "PENDING_REVIEW";

  @Column(name = "findings_summary", columnDefinition = "TEXT")
  private String findingsSummary;

  @Column(name = "avatar_color", length = 64)
  private String avatarColor;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public PatientProfile() {}

  public PatientProfile(String mrn, String fullName, Integer age, String gender, String phone) {
    this.mrn = mrn;
    this.fullName = fullName;
    this.age = age;
    this.gender = gender;
    this.phone = phone;
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

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getMrn() {
    return mrn;
  }

  public void setMrn(String mrn) {
    this.mrn = mrn;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public Integer getAge() {
    return age;
  }

  public void setAge(Integer age) {
    this.age = age;
  }

  public String getGender() {
    return gender;
  }

  public void setGender(String gender) {
    this.gender = gender;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
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

  public Boolean getHasDiabetes() {
    return hasDiabetes != null ? hasDiabetes : false;
  }

  public void setHasDiabetes(Boolean hasDiabetes) {
    this.hasDiabetes = hasDiabetes;
  }

  public Boolean getHasHypertension() {
    return hasHypertension != null ? hasHypertension : false;
  }

  public void setHasHypertension(Boolean hasHypertension) {
    this.hasHypertension = hasHypertension;
  }

  public Boolean getHistoryOfSmoking() {
    return historyOfSmoking != null ? historyOfSmoking : false;
  }

  public void setHistoryOfSmoking(Boolean historyOfSmoking) {
    this.historyOfSmoking = historyOfSmoking;
  }

  public String getLastExamDate() {
    return lastExamDate;
  }

  public void setLastExamDate(String lastExamDate) {
    this.lastExamDate = lastExamDate;
  }

  public String getAssignedDoctor() {
    return assignedDoctor;
  }

  public void setAssignedDoctor(String assignedDoctor) {
    this.assignedDoctor = assignedDoctor;
  }

  public Integer getRiskScore() {
    return riskScore != null ? riskScore : 0;
  }

  public void setRiskScore(Integer riskScore) {
    this.riskScore = riskScore;
  }

  public String getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(String riskLevel) {
    this.riskLevel = riskLevel;
  }

  public String getReviewStatus() {
    return reviewStatus;
  }

  public void setReviewStatus(String reviewStatus) {
    this.reviewStatus = reviewStatus;
  }

  public String getFindingsSummary() {
    return findingsSummary;
  }

  public void setFindingsSummary(String findingsSummary) {
    this.findingsSummary = findingsSummary;
  }

  public String getAvatarColor() {
    return avatarColor;
  }

  public void setAvatarColor(String avatarColor) {
    this.avatarColor = avatarColor;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
