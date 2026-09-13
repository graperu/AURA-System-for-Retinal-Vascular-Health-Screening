package com.aura.screening.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateScreeningRequest(
    @JsonProperty("imageUrl")
    @NotBlank(message = "Đường dẫn ảnh không được để trống")
    String imageUrl,

    @JsonProperty("eyePosition")
    @JsonAlias("eye")
    String eyePosition,

    @JsonProperty("scanType")
    String scanType,

    @JsonProperty("fileName")
    String fileName,

    @JsonProperty("fileSize")
    Long fileSize,

    @JsonProperty("mimeType")
    String mimeType,

    @JsonProperty("riskScore")
    Integer riskScore,

    @JsonProperty("avRatio")
    Double avRatio,

    @JsonProperty("vesselDensity")
    String vesselDensity,

    @JsonProperty("clinicId")
    UUID clinicId
) {}
