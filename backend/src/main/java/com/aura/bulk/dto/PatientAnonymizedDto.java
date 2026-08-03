package com.aura.bulk.dto;

import java.time.Instant;

/**
 * Java 21 Record for HIPAA NFR-9 / NFR-10 compliant anonymized patient payload.
 * Cryptographic SHA-256 HMAC pseudonyms replace raw MRN & Patient Name before AI queuing.
 */
public record PatientAnonymizedDto(
    String pseudonymId,
    String deidentifiedMrn,
    int age,
    String gender,
    int systolicBp,
    int diastolicBp,
    double hbA1c,
    boolean hasDiabetes,
    boolean hasHypertension,
    Instant anonymizedAt
) {
    public PatientAnonymizedDto {
        if (anonymizedAt == null) {
            anonymizedAt = Instant.now();
        }
    }
}
