package com.aura.backend.analysis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record DemoAnalysisRequest(
        @NotNull UUID analysisId,
        @NotNull UUID examinationId,
        @NotNull UUID imageId,
        @NotBlank @Pattern(regexp = "^(Fundus|OCT)$", message = "must be Fundus or OCT") String imageType,
        @NotBlank @Pattern(regexp = "^https?://.+", message = "must be an HTTP(S) URL") String imageUrl) {
}
