package com.aura.realtime;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ScreeningCompletedData(
    UUID screeningId,
    UUID patientId,
    UUID clinicId,
    UUID doctorId,
    Integer overallRiskScore,
    String riskLevel,
    Double confidence,
    Integer cardiovascularRiskScore,
    String cardiovascularRiskLevel,
    Integer diabeticRetinopathyRiskScore,
    String diabeticRetinopathyRiskLevel,
    Integer strokeRiskScore,
    String strokeRiskLevel,
    Integer hypertensionRiskScore,
    String hypertensionRiskLevel,
    String etdrsGrade,
    Map<String, Object> biomarkers,
    Integer detectedAnomaliesCount,
    String findings,
    String recommendations,
    String status,
    Instant completedAt
) {}
