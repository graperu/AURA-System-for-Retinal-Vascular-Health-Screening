package com.aura.feedback.dto;

import com.aura.feedback.entity.DoctorFeedback;
import java.time.Instant;
import java.util.UUID;

public record DoctorFeedbackResponse(
    UUID id,
    UUID doctorId,
    UUID screeningId,
    String aiRiskLevel,
    String doctorRiskLevel,
    Boolean isAccurate,
    String feedbackNotes,
    String vesselAnnotationData,
    Boolean includedInRetraining,
    Instant createdAt) {

  public static DoctorFeedbackResponse fromEntity(DoctorFeedback feedback) {
    return new DoctorFeedbackResponse(
        feedback.getId(),
        feedback.getDoctorId(),
        feedback.getScreeningId(),
        feedback.getAiRiskLevel(),
        feedback.getDoctorRiskLevel(),
        feedback.getIsAccurate(),
        feedback.getFeedbackNotes(),
        feedback.getVesselAnnotationData(),
        feedback.getIncludedInRetraining(),
        feedback.getCreatedAt());
  }
}
