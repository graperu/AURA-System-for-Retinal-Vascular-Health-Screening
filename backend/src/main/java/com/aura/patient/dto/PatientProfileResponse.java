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
        profile.getAge(),
        profile.getGender() != null ? profile.getGender() : "Other",
        profile.getPhoneNumber(),
        profile.getAddress(),
        profile.getBloodType(),
        profile.getSystolicBp(),
        profile.getDiastolicBp(),
        profile.getHba1c(),
        profile.getHasDiabetes(),
        profile.getDiabetesType(),
        profile.getDiabetesDurationYears(),
        profile.getHasHypertension(),
        profile.getHistoryOfSmoking(),
        profile.getHistoryOfHeartDisease(),
        profile.getHistoryOfStroke(),
        profile.getCurrentMedications(),
        profile.getAllergies(),
        profile.getEmergencyContactName(),
        profile.getEmergencyContactPhone(),
        profile.getAssignedDoctor(),
        profile.getUpdatedAt() != null ? profile.getUpdatedAt().toString() : null
    );
  }
}
