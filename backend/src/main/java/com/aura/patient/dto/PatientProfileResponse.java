package com.aura.patient.dto;

import com.aura.patient.entity.PatientMedicalProfile;
import java.time.LocalDate;
import java.util.UUID;

public record PatientProfileResponse(
    UUID id,
    UUID userId,
    String mrn,
    String fullName,
    String email,
    LocalDate dateOfBirth,
    Integer age,
    String gender,
    String phoneNumber,
    String address,
    String bloodType,
    Integer systolicBp,
    Integer diastolicBp,
    Double hba1c,
    Boolean hasDiabetes,
    String diabetesType,
    Integer diabetesDurationYears,
    Boolean hasHypertension,
    Boolean historyOfSmoking,
    Boolean historyOfHeartDisease,
    Boolean historyOfStroke,
    String currentMedications,
    String allergies,
    String emergencyContactName,
    String emergencyContactPhone,
    String assignedDoctor,
    String updatedAt
) {
  public static PatientProfileResponse fromEntity(PatientMedicalProfile profile) {
    var user = profile.getUser();
    return new PatientProfileResponse(
        profile.getId(),
        user != null ? user.getId() : null,
        profile.getMrn(),
        user != null ? user.getFullName() : "",
        user != null ? user.getEmail() : "",
        profile.getDateOfBirth(),
        profile.getAge() != null ? profile.getAge() : 45,
        profile.getGender() != null ? profile.getGender() : "Other",
        profile.getPhoneNumber(),
        profile.getAddress(),
        profile.getBloodType(),
        profile.getSystolicBp() != null ? profile.getSystolicBp() : 120,
        profile.getDiastolicBp() != null ? profile.getDiastolicBp() : 80,
        profile.getHba1c() != null ? profile.getHba1c() : 5.6,
        Boolean.TRUE.equals(profile.getHasDiabetes()),
        profile.getDiabetesType() != null ? profile.getDiabetesType() : "None",
        profile.getDiabetesDurationYears() != null ? profile.getDiabetesDurationYears() : 0,
        Boolean.TRUE.equals(profile.getHasHypertension()),
        Boolean.TRUE.equals(profile.getHistoryOfSmoking()),
        Boolean.TRUE.equals(profile.getHistoryOfHeartDisease()),
        Boolean.TRUE.equals(profile.getHistoryOfStroke()),
        profile.getCurrentMedications(),
        profile.getAllergies(),
        profile.getEmergencyContactName(),
        profile.getEmergencyContactPhone(),
        profile.getAssignedDoctor() != null ? profile.getAssignedDoctor() : "BS. CKII Nguyễn Thị Thanh",
        profile.getUpdatedAt() != null ? profile.getUpdatedAt().toString() : ""
    );
  }
}
