package com.aura.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ScreeningProcessingData(
    UUID screeningId,
    UUID patientId,
    String step,
    int stepIndex,
    int totalSteps,
    String stepTitle,
    String statusMessage,
    Instant updatedAt
) {
  public static ScreeningProcessingData of(
      UUID screeningId,
      UUID patientId,
      String step,
      int stepIndex,
      int totalSteps,
      String stepTitle,
      String statusMessage
  ) {
    return new ScreeningProcessingData(
        screeningId,
        patientId,
        step,
        stepIndex,
        totalSteps,
        stepTitle,
        statusMessage,
        Instant.now()
    );
  }
}
