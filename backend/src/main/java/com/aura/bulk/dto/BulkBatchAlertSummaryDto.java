package com.aura.bulk.dto;

import java.util.List;

/**
 * Java 21 Record summarizing emergency alerts and abnormal trend notifications in a batch (FR-29).
 */
public record BulkBatchAlertSummaryDto(
    String batchId,
    String clinicId,
    int totalAlerts,
    int criticalAlertsCount,
    int warningAlertsCount,
    boolean hasAbnormalTrend,
    String abnormalTrendMessage,
    List<BulkBatchAlertDto> alerts
) {}
