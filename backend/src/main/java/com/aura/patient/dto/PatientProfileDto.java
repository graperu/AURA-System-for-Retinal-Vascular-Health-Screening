package com.aura.patient.dto;

import com.aura.patient.entity.PatientProfile;
import java.time.Instant;
import java.util.UUID;

public record PatientProfileDto(
    UUID id,
    UUID userId,
    String mrn,
    String fullName,
    Integer age,
    String gender,
    String phone,
    String address,
    Integer systolicBp,
    Integer diastolicBp,
    Double hba1c,
    Boolean hasDiabetes,
    Boolean hasHypertension,
    Boolean historyOfSmoking,
    String lastExamDate,
    String assignedDoctor,
    Integer riskScore,
    String riskLevel,
    String reviewStatus,
    String findingsSummary,
    String avatarColor,
    Instant createdAt,
    Instant updatedAt) {

  public static PatientProfileDto from(PatientProfile entity) {
    return new PatientProfileDto(
        entity.getId(),
        entity.getUserId(),
        entity.getMrn(),
        entity.getFullName(),
        entity.getAge(),
        entity.getGender(),
        entity.getPhone(),
        entity.getAddress(),
        entity.getSystolicBp(),
        entity.getDiastolicBp(),
        entity.getHba1c(),
        entity.getHasDiabetes(),
        entity.getHasHypertension(),
        entity.getHistoryOfSmoking(),
        entity.getLastExamDate(),
        entity.getAssignedDoctor(),
        entity.getRiskScore(),
        entity.getRiskLevel(),
        entity.getReviewStatus(),
        entity.getFindingsSummary(),
        entity.getAvatarColor(),
        entity.getCreatedAt(),
        entity.getUpdatedAt());
  }
}
