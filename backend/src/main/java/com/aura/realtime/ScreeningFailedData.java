package com.aura.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ScreeningFailedData(
    UUID screeningId,
    UUID patientId,
    String errorCode,
    String errorMessage,
    Instant failedAt
) {
  public static ScreeningFailedData of(UUID screeningId, UUID patientId, String errorCode, String errorMessage) {
    return new ScreeningFailedData(screeningId, patientId, errorCode, errorMessage, Instant.now());
  }
}
