package com.aura.clinic.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.clinic.service.ClinicAnalyticsService;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ClinicAnalyticsControllerTest {

  @Mock
  private ClinicAnalyticsService analyticsService;

  @InjectMocks
  private ClinicAnalyticsController controller;

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Test
  @DisplayName("GET /api/v1/clinic/analytics/campaigns - Lấy số liệu phân tích chiến dịch sàng lọc thành công -> HTTP 200")
  void getCampaignAnalytics_success() throws Exception {
    Map<String, Object> analyticsData = new HashMap<>();
    analyticsData.put("totalCampaigns", 25);
    analyticsData.put("totalImages", 3400);
    analyticsData.put("highRiskPatients", 95);

    when(analyticsService.getCampaignAnalytics()).thenReturn(analyticsData);

    mockMvc.perform(get("/api/v1/clinic/analytics/campaigns"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.totalCampaigns").value(25))
        .andExpect(jsonPath("$.data.totalImages").value(3400))
        .andExpect(jsonPath("$.data.highRiskPatients").value(95));

    verify(analyticsService).getCampaignAnalytics();
  }

  @Test
  @DisplayName("GET /api/v1/clinic/analytics/export - Xuất dữ liệu nghiên cứu dạng CSV -> HTTP 200, text/csv, header Content-Disposition")
  void exportResearchData_success() throws Exception {
    String csvContent = "Campaign ID,Date,Images,High Risk\n"
        + "CAMP-001,2026-09-01,100,5\n"
        + "CAMP-002,2026-09-02,150,10\n";

    when(analyticsService.generateExportDataCsv()).thenReturn(csvContent);

    mockMvc.perform(get("/api/v1/clinic/analytics/export"))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aura_clinic_export.csv\""))
        .andExpect(content().contentType("text/csv"))
        .andExpect(content().string(containsString("CAMP-001,2026-09-01,100,5")));

    verify(analyticsService).generateExportDataCsv();
  }
}
