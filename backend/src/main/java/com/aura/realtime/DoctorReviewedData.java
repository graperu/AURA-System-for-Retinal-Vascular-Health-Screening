package com.aura.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DoctorReviewedData(
    UUID screeningId,
    UUID patientId,
    UUID doctorId,
    String doctorName,
    String decision,
    String doctorNotes,
    String finalRiskLevel,
    List<String> icd10Codes,
    String digitalSignature,
    Instant signedAt,
    String status
) {}
