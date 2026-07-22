package com.aura.backend.system.controller;

import com.aura.backend.system.dto.DependencyStatus;
import com.aura.backend.system.dto.SystemInfoResponse;
import com.aura.backend.system.service.SystemStatusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class HealthControllerTest {

    private SystemStatusService systemStatusService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        systemStatusService = mock(SystemStatusService.class);
        mockMvc = standaloneSetup(new HealthController(systemStatusService)).build();
    }

    @Test
    void healthReturnsDependencyStatusInEnvelope() throws Exception {
        when(systemStatusService.getSystemInfo()).thenReturn(healthySystemInfo());

        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("healthy"))
                .andExpect(jsonPath("$.data.database.status").value("healthy"))
                .andExpect(jsonPath("$.data.aiCore.status").value("healthy"))
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.traceId").isNotEmpty());
    }

    private SystemInfoResponse healthySystemInfo() {
        return new SystemInfoResponse(
                "AURA Java API",
                "test",
                "test",
                "healthy",
                new DependencyStatus("healthy"),
                new DependencyStatus("healthy"),
                Instant.parse("2026-07-22T00:00:00Z"));
    }
}
