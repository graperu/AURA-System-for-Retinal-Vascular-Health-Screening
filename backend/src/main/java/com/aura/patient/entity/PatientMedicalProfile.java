package com.aura.patient.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "patient_medical_profiles")
public class PatientMedicalProfile {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(name = "mrn", nullable = false, unique = true, length = 64)
  private String mrn;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(name = "age")
  private Integer age;

  @Column(name = "gender", length = 16)
  private String gender = "Other";

  @Column(name = "phone_number", length = 32)
  private String phoneNumber;

  @Column(name = "address", length = 255)
  private String address;

  @Column(name = "blood_type", length = 8)
  private String bloodType;

  @Column(name = "systolic_bp")
  private Integer systolicBp;

  @Column(name = "diastolic_bp")
  private Integer diastolicBp;

  @Column(name = "hba1c")
  private Double hba1c;

  @Column(name = "has_diabetes")
  private Boolean hasDiabetes = false;

  @Column(name = "diabetes_type", length = 32)
  private String diabetesType = "None";

  @Column(name = "diabetes_duration_years")
  private Integer diabetesDurationYears = 0;

  @Column(name = "has_hypertension")
  private Boolean hasHypertension = false;

  @Column(name = "history_of_smoking")
  private Boolean historyOfSmoking = false;

  @Column(name = "history_of_heart_disease")
  private Boolean historyOfHeartDisease = false;

  @Column(name = "history_of_stroke")
  private Boolean historyOfStroke = false;

  @Column(name = "current_medications", columnDefinition = "TEXT")
  private String currentMedications;

  @Column(name = "allergies", columnDefinition = "TEXT")
  private String allergies;

  @Column(name = "emergency_contact_name", length = 150)
  private String emergencyContactName;

  @Column(name = "emergency_contact_phone", length = 32)
  private String emergencyContactPhone;

  @Column(name = "assigned_doctor", length = 150)
  private String assignedDoctor = "BS. CKII Nguyễn Thị Thanh";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected PatientMedicalProfile() {}

  public PatientMedicalProfile(User user, String mrn) {
    this.user = user;
    this.mrn = mrn;
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

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public String getMrn() {
    return mrn;
  }

  public void setMrn(String mrn) {
    this.mrn = mrn;
  }

  public LocalDate getDateOfBirth() {
    return dateOfBirth;
  }

  public void setDateOfBirth(LocalDate dateOfBirth) {
    this.dateOfBirth = dateOfBirth;
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

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getBloodType() {
    return bloodType;
  }

  public void setBloodType(String bloodType) {
    this.bloodType = bloodType;
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
    return hasDiabetes;
  }

  public void setHasDiabetes(Boolean hasDiabetes) {
    this.hasDiabetes = hasDiabetes;
  }

  public String getDiabetesType() {
    return diabetesType;
  }

  public void setDiabetesType(String diabetesType) {
    this.diabetesType = diabetesType;
  }

  public Integer getDiabetesDurationYears() {
    return diabetesDurationYears;
  }

  public void setDiabetesDurationYears(Integer diabetesDurationYears) {
    this.diabetesDurationYears = diabetesDurationYears;
  }

  public Boolean getHasHypertension() {
    return hasHypertension;
  }

  public void setHasHypertension(Boolean hasHypertension) {
    this.hasHypertension = hasHypertension;
  }

  public Boolean getHistoryOfSmoking() {
    return historyOfSmoking;
  }

  public void setHistoryOfSmoking(Boolean historyOfSmoking) {
    this.historyOfSmoking = historyOfSmoking;
  }

  public Boolean getHistoryOfHeartDisease() {
    return historyOfHeartDisease;
  }

  public void setHistoryOfHeartDisease(Boolean historyOfHeartDisease) {
    this.historyOfHeartDisease = historyOfHeartDisease;
  }

  public Boolean getHistoryOfStroke() {
    return historyOfStroke;
  }

  public void setHistoryOfStroke(Boolean historyOfStroke) {
    this.historyOfStroke = historyOfStroke;
  }

  public String getCurrentMedications() {
    return currentMedications;
  }

  public void setCurrentMedications(String currentMedications) {
    this.currentMedications = currentMedications;
  }

  public String getAllergies() {
    return allergies;
  }

  public void setAllergies(String allergies) {
    this.allergies = allergies;
  }

  public String getEmergencyContactName() {
    return emergencyContactName;
  }

  public void setEmergencyContactName(String emergencyContactName) {
    this.emergencyContactName = emergencyContactName;
  }

  public String getEmergencyContactPhone() {
    return emergencyContactPhone;
  }

  public void setEmergencyContactPhone(String emergencyContactPhone) {
    this.emergencyContactPhone = emergencyContactPhone;
  }

  public String getAssignedDoctor() {
    return assignedDoctor;
  }

  public void setAssignedDoctor(String assignedDoctor) {
    this.assignedDoctor = assignedDoctor;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
