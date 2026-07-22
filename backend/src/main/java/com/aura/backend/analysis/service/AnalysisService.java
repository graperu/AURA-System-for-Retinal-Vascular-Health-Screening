package com.aura.backend.analysis.service;

import com.aura.backend.analysis.client.AiCoreClient;
import com.aura.backend.analysis.dto.AnalysisResponse;
import com.aura.backend.analysis.dto.DemoAnalysisRequest;
import org.springframework.stereotype.Service;

@Service
public class AnalysisService {

    private final AiCoreClient aiCoreClient;

    public AnalysisService(AiCoreClient aiCoreClient) {
        this.aiCoreClient = aiCoreClient;
    }

    public AnalysisResponse analyzeDemo(DemoAnalysisRequest request) {
        return aiCoreClient.analyze(request);
    }
}
