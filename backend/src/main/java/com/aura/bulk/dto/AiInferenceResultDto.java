package com.aura.bulk.dto;

import java.util.List;

/**
 * Java 21 Record representing Cloud AI Engine / PyTorch AI Microservice output.
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
    List<String> xaiRationales,
    String detectedAnomaliesJson
) {
    /**
     * Backward-compatible 15-parameter constructor for existing tests and consumers.
     */
    public AiInferenceResultDto(
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
    ) {
        this(
            analysisId,
            executionTimeMs,
            overallVascularRiskScore,
            cardiovascularRiskScore,
            cardiovascularRiskLevel,
            diabeticRetinopathyScore,
            diabeticRetinopathyLevel,
            threeYearStrokeRiskPercent,
            arteryVeinRatio,
            vesselDensityPercentage,
            tortuosityIndex,
            opticCupToDiscRatio,
            heatmapOverlayUrl,
            detectedAnomaliesCount,
            xaiRationales,
            "[]"
        );
    }
}
