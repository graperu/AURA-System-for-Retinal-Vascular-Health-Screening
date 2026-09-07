package com.aura.clinic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitClinicProfileRequest(
    @NotBlank @Size(max = 255) String organizationName,
    @Size(max = 100) String licenseNumber,
    String licenseDocumentUrl) {}
