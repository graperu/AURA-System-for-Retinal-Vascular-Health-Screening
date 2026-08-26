package com.aura.ai.dto;

public record AiScreeningResponse(
    String riskLevel,
    Double confidence,
    String findings,
    String modelVersion
) {
}
