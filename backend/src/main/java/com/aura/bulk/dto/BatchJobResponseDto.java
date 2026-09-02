package com.aura.bulk.dto;

import java.time.Instant;
import java.util.List;

/**
 * Java 21 Record for status polling and progress tracking of a bulk screening batch job.
 */
public record BatchJobResponseDto(
    String batchId,
    String clinicId,
    int totalImages,
    int processedCount,
    int failedCount,
    String status, // QUEUED, IN_PROGRESS, COMPLETED, PAUSED, CANCELLED
    Instant createdAt,
    double estimatedTimeRemainingSeconds,
    List<BatchJobItemStatusDto> items
) {}
