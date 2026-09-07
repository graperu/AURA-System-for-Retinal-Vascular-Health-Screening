package com.aura.bulk.dto;

import java.time.Instant;

/**
 * Java 21 Record for aggregated risk statistics across all patients in a batch (FR-25).
 */
public record BulkBatchRiskStatisticsDto(
    String batchId,
    String clinicId,
    int totalImages,
    int processedCount,
    int failedCount,
    int pendingCount,
    double averageVascularRiskScore,
    double averageStrokeRiskPercent,
    int highRiskPatientCount,
    int severeAnomaliesDetectedCount,
    RiskDistributionDto riskDistribution,
    Instant calculatedAt
) {}
