package com.aura.admin.dto;

import jakarta.validation.constraints.Size;

public record UpdateClinicAdminRequest(
    @Size(max = 255) String organizationName,
    @Size(max = 100) String licenseNumber,
    String licenseDocumentUrl) {}
