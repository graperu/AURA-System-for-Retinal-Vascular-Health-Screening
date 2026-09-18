package com.aura.bulk.service;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.screening.service.GeminiRetinalAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service client communicating with Cloud AI Engine (Gemini 3.8 Flash High API).
 */
@Service
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);
    private final GeminiRetinalAiService geminiAiService;

    public AiServiceClient(@Autowired(required = false) GeminiRetinalAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    /**
     * Executes Cloud AI vessel segmentation and risk scoring for an anonymized image.
     */
    public AiInferenceResultDto executeFundusAnalysis(
            String pseudonymPatientId,
            String eyePosition,
            String anonymizedImageBase64) {
        
        long startTime = System.currentTimeMillis();

        if (geminiAiService == null) {
            log.error("[AI Client] Gemini Retinal AI Service is not available or offline.");
            throw new IllegalStateException("AI Service is unavailable or offline");
        }

        log.info("[AI Client] Dispatching image for patient {} to Cloud Gemini 3.8 Flash High API...", pseudonymPatientId);

        Map<String, Object> aiResult;
        try {
            aiResult = geminiAiService.analyzeRetinalVascular(eyePosition, anonymizedImageBase64);
        } catch (Exception ex) {
            log.error("[AI Client] Cloud Gemini API inference exception: {}", ex.getMessage());
            throw new IllegalStateException("AI inference execution failed: " + ex.getMessage(), ex);
        }

        if (aiResult == null) {
            log.error("[AI Client] Cloud Gemini API returned null or empty result for patient {}", pseudonymPatientId);
            throw new IllegalStateException("AI engine returned null response or analysis failed");
        }

        Number overallScore = (Number) aiResult.get("overallVascularRiskScore");
        Map<String, Object> biomarkers = (Map<String, Object>) aiResult.get("biomarkers");

        double avRatio = biomarkers != null && biomarkers.get("avRatio") != null ? ((Number) biomarkers.get("avRatio")).doubleValue() : 0.62;
        double vesselDensity = biomarkers != null && biomarkers.get("vesselDensityPercent") != null ? ((Number) biomarkers.get("vesselDensityPercent")).doubleValue() : 17.0;
        double tortuosity = biomarkers != null && biomarkers.get("tortuosityIndex") != null ? ((Number) biomarkers.get("tortuosityIndex")).doubleValue() : 1.15;
        double cdr = biomarkers != null && biomarkers.get("verticalCdr") != null ? ((Number) biomarkers.get("verticalCdr")).doubleValue() : 0.35;

        int score = overallScore != null ? overallScore.intValue() : 50;
        String riskLevel = score >= 80 ? "CRITICAL" : score >= 65 ? "HIGH" : score >= 40 ? "MODERATE" : "LOW";
        String heatmap = (String) aiResult.get("heatmapBase64");
        if (heatmap == null || heatmap.isBlank()) {
            heatmap = null;
        }

        return new AiInferenceResultDto(
                UUID.randomUUID().toString(),
                System.currentTimeMillis() - startTime,
                score,
                score,
                riskLevel,
                Math.max(20, score - 10),
                riskLevel,
                score * 0.4,
                avRatio,
                vesselDensity,
                tortuosity,
                cdr,
                heatmap,
                0,
                List.of("Phân tích tự động từ Cloud AI Gemini 3.8 Flash High")
        );
    }
}
