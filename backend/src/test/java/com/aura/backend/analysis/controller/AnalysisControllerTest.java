package com.aura.backend.analysis.controller;

import com.aura.backend.analysis.dto.AnalysisResponse;
import com.aura.backend.analysis.service.AnalysisService;
import com.aura.backend.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class AnalysisControllerTest {

    private AnalysisService analysisService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        analysisService = mock(AnalysisService.class);
        mockMvc = standaloneSetup(new AnalysisController(analysisService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void demoAnalysisReturnsAiCoreResultInEnvelope() throws Exception {
        UUID analysisId = UUID.fromString("7d3a2ac6-45be-4f78-9916-7028aa433edb");
        when(analysisService.analyzeDemo(any())).thenReturn(new AnalysisResponse(
                analysisId,
                "completed_mock",
                List.of("Mock finding"),
                "low_mock",
                new BigDecimal("0.87"),
                "mock-retinal-v1",
                Instant.parse("2026-07-22T00:00:00Z"),
                "Mock screening result only; not a medical diagnosis."));

        mockMvc.perform(post("/api/v1/analyses/demo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "analysisId": "7d3a2ac6-45be-4f78-9916-7028aa433edb",
                                  "examinationId": "03259d3a-430f-4d3f-ab6a-f75720f7da5d",
                                  "imageId": "43d453b8-f482-442c-bb5f-6257500682fb",
                                  "imageType": "Fundus",
                                  "imageUrl": "https://example.invalid/mock.jpg"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.analysisId").value(analysisId.toString()))
                .andExpect(jsonPath("$.data.status").value("completed_mock"))
                .andExpect(jsonPath("$.data.confidence").value(0.87))
                .andExpect(jsonPath("$.data.modelVersion").value("mock-retinal-v1"));
    }

    @Test
    void demoAnalysisRejectsInvalidImageType() throws Exception {
        mockMvc.perform(post("/api/v1/analyses/demo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "analysisId": "7d3a2ac6-45be-4f78-9916-7028aa433edb",
                                  "examinationId": "03259d3a-430f-4d3f-ab6a-f75720f7da5d",
                                  "imageId": "43d453b8-f482-442c-bb5f-6257500682fb",
                                  "imageType": "MRI",
                                  "imageUrl": "https://example.invalid/mock.jpg"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
