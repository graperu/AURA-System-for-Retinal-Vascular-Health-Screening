package com.aura.admin.dto;

import java.util.UUID;

public record AssignmentDoctorDto(
    UUID id, String fullName, String email, long assignedPatientCount) {}
