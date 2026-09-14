package com.aura.clinic.controller;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.clinic.service.ClinicAnalyticsService;
import com.aura.common.response.ErrorCode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@ExtendWith(MockitoExtension.class)
class ClinicAnalyticsControllerTest {

  @Mock
  private ClinicAnalyticsService analyticsService;

  @InjectMocks
  private ClinicAnalyticsController controller;

  private MockMvc mockMvc;
  private final UUID testClinicId = UUID.randomUUID();
  private final AuraUserPrincipal testPrincipal = new AuraUserPrincipal(
      testClinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
  );

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
          @Override
          public boolean supportsParameter(MethodParameter parameter) {
            return parameter.getParameterType().isAssignableFrom(AuraUserPrincipal.class);
          }

          @Override
          public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
              NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            return testPrincipal;
          }
        })
        .build();
  }

  @Test
  @DisplayName("GET /api/v1/clinic/analytics/campaigns - Lấy số liệu phân tích chiến dịch sàng lọc thành công -> HTTP 200")
  void getCampaignAnalytics_success() throws Exception {
    Map<String, Object> analyticsData = new HashMap<>();
    analyticsData.put("totalCampaigns", 25);
    analyticsData.put("totalImages", 3400);
    analyticsData.put("highRiskPatients", 95);

    when(analyticsService.getCampaignAnalytics(testClinicId)).thenReturn(analyticsData);

    mockMvc.perform(get("/api/v1/clinic/analytics/campaigns"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.totalCampaigns").value(25))
        .andExpect(jsonPath("$.data.totalImages").value(3400))
        .andExpect(jsonPath("$.data.highRiskPatients").value(95));

    verify(analyticsService).getCampaignAnalytics(testClinicId);
  }

  @Test
  @DisplayName("GET /api/v1/clinic/analytics/export - Xuất dữ liệu nghiên cứu dạng CSV -> HTTP 200, text/csv, header Content-Disposition")
  void exportResearchData_success() throws Exception {
    String csvContent = "Campaign ID,Date,Images,High Risk\n"
        + "CAMP-001,2026-09-01,100,5\n"
        + "CAMP-002,2026-09-02,150,10\n";

    when(analyticsService.generateExportDataCsv(testClinicId)).thenReturn(csvContent);

    mockMvc.perform(get("/api/v1/clinic/analytics/export"))
        .andExpect(status().isOk())
        .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aura_clinic_export.csv\""))
        .andExpect(content().contentType("text/csv"))
        .andExpect(content().string(containsString("CAMP-001,2026-09-01,100,5")));

    verify(analyticsService).generateExportDataCsv(testClinicId);
  }

  @Test
  @DisplayName("Khi principal là null -> ném AuthException UNAUTHORIZED")
  void endpoints_whenPrincipalNull_throwsAuthException() {
    assertThatThrownBy(() -> controller.getCampaignAnalytics(null))
        .isInstanceOf(AuthException.class);
    assertThatThrownBy(() -> controller.exportData(null))
        .isInstanceOf(AuthException.class);
  }
}
