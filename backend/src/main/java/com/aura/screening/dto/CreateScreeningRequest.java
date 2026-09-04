package com.aura.screening.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateScreeningRequest(
    @NotBlank(message = "Đường dẫn ảnh không được để trống")
    String imageUrl,
    String eyePosition,
    String scanType,
    String fileName,
    Long fileSize,
    String mimeType,
    Integer riskScore,
    Double avRatio,
    String vesselDensity
) {}
