package com.aura.bulk.dto;

/**
 * Java 21 Record representing the status of an individual image inside a bulk batch queue.
 */
public record BatchJobItemStatusDto(
    String itemId,
    String fileName,
    String eyePosition,
    String pseudonymPatientId,
    String patientName,
    String rawMrn,
    int patientAge,
    String patientGender,
    int systolicBp,
    int diastolicBp,
    double hbA1c,
    String status, // QUEUED, PROCESSING, COMPLETED, FAILED
    long durationMs,
    AiInferenceResultDto aiResult
) {
    public BatchJobItemStatusDto(
        String itemId,
        String fileName,
        String eyePosition,
        String pseudonymPatientId,
        String status,
        long durationMs,
        AiInferenceResultDto aiResult
    ) {
        this(itemId, fileName, eyePosition, pseudonymPatientId, null, null, 0, null, 0, 0, 0.0, status, durationMs, aiResult);
    }
}

