package com.aura.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ReviewClinicProfileRequest(
    @NotBlank @Pattern(regexp = "APPROVED|REJECTED") String decision, String rejectionReason) {}
