package com.aura.bulk.dto;

import java.time.Instant;

/**
 * Java 21 Record for an individual emergency alert for high-risk patients or severe anomalies (FR-29).
 */
public record BulkBatchAlertDto(
    String alertId,
    String batchId,
    String itemId,
    String patientPseudonym,
    String riskLevel,
    int riskScore,
    String severity, // CRITICAL, WARNING
    String title,
    String reason,
    double strokeRiskPercent,
    int anomaliesCount,
    String recommendedAction,
    Instant createdAt
) {}
