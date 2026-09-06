package com.aura.bulk.dto;

import java.util.List;

/**
 * Java 21 Record representing Python AI Microservice (PyTorch ResNet50-VesselNet) output.
 */
public record AiInferenceResultDto(
    String analysisId,
    long executionTimeMs,
    int overallVascularRiskScore,
    int cardiovascularRiskScore,
    String cardiovascularRiskLevel,
    int diabeticRetinopathyScore,
    String diabeticRetinopathyLevel,
    double threeYearStrokeRiskPercent,
    double arteryVeinRatio,
    double vesselDensityPercentage,
    double tortuosityIndex,
    double opticCupToDiscRatio,
    String heatmapOverlayUrl,
    int detectedAnomaliesCount,
    List<String> xaiRationales
) {}
