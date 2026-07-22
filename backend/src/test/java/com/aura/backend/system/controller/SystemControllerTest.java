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

class SystemControllerTest {

    private SystemStatusService systemStatusService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        systemStatusService = mock(SystemStatusService.class);
        mockMvc = standaloneSetup(new SystemController(systemStatusService)).build();
    }

    @Test
    void systemInfoMatchesFrontendContract() throws Exception {
        when(systemStatusService.getSystemInfo()).thenReturn(new SystemInfoResponse(
                "AURA Java API",
                "1.0.0-milestone.1",
                "test",
                "degraded",
                new DependencyStatus("unavailable"),
                new DependencyStatus("healthy"),
                Instant.parse("2026-07-22T00:00:00Z")));

        mockMvc.perform(get("/api/v1/system/info"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("AURA Java API"))
                .andExpect(jsonPath("$.data.database.status").value("unavailable"))
                .andExpect(jsonPath("$.data.aiCore.status").value("healthy"));
    }
}
