package com.aura.doctor.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DoctorPatientSummaryResponse(
    UUID patientId,
    String mrn,
    String fullName,
    String email,
    LocalDate dateOfBirth,
    Integer age,
    String gender,
    String phoneNumber,
    String address,
    Integer systolicBp,
    Integer diastolicBp,
    Double hba1c,
    Boolean hasDiabetes,
    Boolean hasHypertension,
    Instant lastScreeningAt,
    String latestRiskLevel,
    long screeningCount,
    Instant assignedAt,
    String assignmentStatus
) {}
