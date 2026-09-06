package com.aura.bulk.dto;

/**
 * Java 21 Record representing the count and percentage breakdown of risk levels in a batch.
 */
public record RiskDistributionDto(
    int lowCount,
    double lowPercentage,
    int moderateCount,
    double moderatePercentage,
    int highCount,
    double highPercentage,
    int criticalCount,
    double criticalPercentage
) {}
