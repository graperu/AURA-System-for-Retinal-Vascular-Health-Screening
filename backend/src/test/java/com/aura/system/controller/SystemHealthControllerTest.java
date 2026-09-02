package com.aura.system.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SystemHealthControllerTest {
  private final MockMvc mockMvc =
      MockMvcBuilders.standaloneSetup(new SystemHealthController()).build();

  @Test
  void returnsHealthyEnvelope() throws Exception {
    mockMvc
        .perform(get("/api/v1/system/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.message").value("AURA backend is healthy"))
        .andExpect(jsonPath("$.data.service").value("aura-backend"))
        .andExpect(jsonPath("$.data.status").value("UP"))
        .andExpect(jsonPath("$.timestamp").exists());
  }
}
