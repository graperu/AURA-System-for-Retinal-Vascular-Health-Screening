package com.aura.bulk.dto;

/**
 * Java 21 Record representing the status of an individual image inside a bulk batch queue.
 */
public record BatchJobItemStatusDto(
    String itemId,
    String fileName,
    String eyePosition,
    String pseudonymPatientId,
    String status, // QUEUED, PROCESSING, COMPLETED, FAILED
    long durationMs,
    AiInferenceResultDto aiResult
) {}
