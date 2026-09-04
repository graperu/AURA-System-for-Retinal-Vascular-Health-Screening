package com.aura.feedback.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record DoctorFeedbackRequest(
    @NotNull(message = "Screening ID is required") UUID screeningId,
    @NotBlank(message = "AI Risk Level is required") String aiRiskLevel,
    @NotBlank(message = "Doctor Risk Level is required") String doctorRiskLevel,
    @NotNull(message = "Accuracy flag is required") Boolean isAccurate,
    String feedbackNotes,
    String vesselAnnotationData) {}
