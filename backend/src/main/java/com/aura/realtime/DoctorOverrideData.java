package com.aura.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DoctorOverrideData(
    UUID screeningId,
    UUID patientId,
    UUID doctorId,
    String originalAiRiskLevel,
    String adjustedDoctorRiskLevel,
    String overrideReason,
    String digitalSignature,
    Instant signedAt
) {}
