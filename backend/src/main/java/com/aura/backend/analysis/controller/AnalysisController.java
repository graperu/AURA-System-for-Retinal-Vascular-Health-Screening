package com.aura.backend.analysis.controller;

import com.aura.backend.analysis.dto.AnalysisResponse;
import com.aura.backend.analysis.dto.DemoAnalysisRequest;
import com.aura.backend.analysis.service.AnalysisService;
import com.aura.backend.common.response.ApiEnvelope;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analyses")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping("/demo")
    public ResponseEntity<ApiEnvelope<AnalysisResponse>> analyzeDemo(
            @Valid @RequestBody DemoAnalysisRequest request) {
        return ResponseEntity.ok(ApiEnvelope.success(analysisService.analyzeDemo(request)));
    }
}
