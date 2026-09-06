package com.aura.bulk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Java 21 Record for individual fundus image item upload payload.
 */
public record BulkImageItemUploadDto(
    @NotBlank(message = "File name is required")
    String fileName,

    @NotBlank(message = "Base64 image content is required")
    String base64ImageContent,

    @NotBlank(message = "Eye position is required (OD / OS)")
    String eyePosition,

    @NotBlank(message = "Raw MRN is required for anonymization step")
    String rawMrn,

    @NotBlank(message = "Raw Patient Name is required for anonymization step")
    String rawPatientName,

    int patientAge,

    @NotBlank(message = "Patient gender is required")
    String patientGender,

    int systolicBp,
    int diastolicBp,
    double hbA1c
) {}
