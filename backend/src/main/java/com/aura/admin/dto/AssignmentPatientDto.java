package com.aura.admin.dto;

import java.util.List;
import java.util.UUID;

public record AssignmentPatientDto(
    UUID id,
    String fullName,
    String email,
    String mrn,
    List<UUID> assignedDoctorIds) {}
