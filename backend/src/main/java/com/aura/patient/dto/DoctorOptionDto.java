package com.aura.patient.dto;

import java.util.UUID;

public record DoctorOptionDto(
    UUID id,
    String fullName,
    String email,
    String specialty,
    String title
) {}
