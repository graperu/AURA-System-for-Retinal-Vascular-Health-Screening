package com.aura.bulk.queue;

import com.aura.bulk.dto.PatientAnonymizedDto;

/**
 * Task item payload queued for background processing.
 */
public record BatchItemTask(
    String batchId,
    String itemId,
    String fileName,
    String eyePosition,
    PatientAnonymizedDto anonymizedPatient,
    String base64ImagePayload
) {}
