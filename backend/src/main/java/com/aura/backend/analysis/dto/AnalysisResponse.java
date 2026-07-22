package com.aura.backend.analysis.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AnalysisResponse(
        UUID analysisId,
        String status,
        List<String> findings,
        String riskLevel,
        BigDecimal confidence,
        String modelVersion,
        Instant processedAt,
        String disclaimer) {
}
