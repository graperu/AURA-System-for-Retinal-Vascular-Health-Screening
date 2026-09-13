package com.aura.bulk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.screening.service.GeminiRetinalAiService;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AiServiceClientTest {

  @Mock
  private GeminiRetinalAiService geminiAiService;

  private AiServiceClient client;

  @BeforeEach
  void setUp() {
    client = new AiServiceClient(geminiAiService);
  }

  @Nested
  @DisplayName("Phân tích ảnh võng mạc thành công với các mức rủi ro lâm sàng")
  class SuccessfulInferenceTests {

    @Test
    @DisplayName("Điểm rủi ro >= 80: Phân loại mức CRITICAL")
    void executeFundusAnalysis_criticalRisk() {
      Map<String, Object> aiResult = new HashMap<>();
      aiResult.put("overallVascularRiskScore", 85);
      Map<String, Object> biomarkers = Map.of(
          "avRatio", 0.52,
          "vesselDensityPercent", 12.5,
          "tortuosityIndex", 1.45,
          "verticalCdr", 0.65
      );
      aiResult.put("biomarkers", biomarkers);

      when(geminiAiService.analyzeRetinalVascular("OD", "base64image")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-001", "OD", "base64image");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(85);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("CRITICAL");
      assertThat(result.threeYearStrokeRiskPercent()).isEqualTo(85 * 0.4);
      assertThat(result.arteryVeinRatio()).isEqualTo(0.52);
      assertThat(result.vesselDensityPercentage()).isEqualTo(12.5);
      assertThat(result.tortuosityIndex()).isEqualTo(1.45);
      assertThat(result.opticCupToDiscRatio()).isEqualTo(0.65);
      assertThat(result.xaiRationales()).contains("Phân tích tự động từ Cloud AI Gemini 3.7 Flash High");
      verify(geminiAiService).analyzeRetinalVascular("OD", "base64image");
    }

    @Test
    @DisplayName("Điểm rủi ro 65 - 79: Phân loại mức HIGH")
    void executeFundusAnalysis_highRisk() {
      Map<String, Object> aiResult = Map.of(
          "overallVascularRiskScore", 72,
          "biomarkers", Map.of("avRatio", 0.58)
      );
      when(geminiAiService.analyzeRetinalVascular("OS", "base64image")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-002", "OS", "base64image");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(72);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("HIGH");
      assertThat(result.arteryVeinRatio()).isEqualTo(0.58);
      // Biomarkers missing fall back to defaults
      assertThat(result.vesselDensityPercentage()).isEqualTo(17.0);
      assertThat(result.tortuosityIndex()).isEqualTo(1.15);
      assertThat(result.opticCupToDiscRatio()).isEqualTo(0.35);
    }

    @Test
    @DisplayName("Điểm rủi ro 40 - 64: Phân loại mức MODERATE")
    void executeFundusAnalysis_moderateRisk() {
      Map<String, Object> aiResult = Map.of(
          "overallVascularRiskScore", 50,
          "biomarkers", Map.of()
      );
      when(geminiAiService.analyzeRetinalVascular("OD", "b64")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-003", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(50);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("MODERATE");
    }

    @Test
    @DisplayName("Điểm rủi ro < 40: Phân loại mức LOW")
    void executeFundusAnalysis_lowRisk() {
      Map<String, Object> aiResult = Map.of(
          "overallVascularRiskScore", 25,
          "biomarkers", Map.of()
      );
      when(geminiAiService.analyzeRetinalVascular("OD", "b64")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-004", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(25);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("LOW");
    }

    @Test
    @DisplayName("Kết quả AI không có overallVascularRiskScore: Mặc định điểm 50")
    void executeFundusAnalysis_nullScoreDefaultsTo50() {
      Map<String, Object> aiResult = new HashMap<>();
      aiResult.put("overallVascularRiskScore", null);
      aiResult.put("biomarkers", null);
      when(geminiAiService.analyzeRetinalVascular("OD", "b64")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-005", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(50);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("MODERATE");
    }
  }

  @Nested
  @DisplayName("Xử lý lỗi và cơ chế an toàn dự phòng (Fail-Safe & Timeout Handling)")
  class FailSafeAndTimeoutTests {

    @Test
    @DisplayName("Timeout khi gọi Cloud AI API -> Trả về kết quả an toàn mặc định (Fail-safe)")
    void executeFundusAnalysis_whenTimeout_returnsFallbackDefault() {
      when(geminiAiService.analyzeRetinalVascular(anyString(), anyString()))
          .thenThrow(new RuntimeException("Connection timed out after 30000ms"));

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-TIMEOUT", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(45);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("MODERATE");
      assertThat(result.threeYearStrokeRiskPercent()).isEqualTo(18.0);
      assertThat(result.xaiRationales()).contains("Phân tích an toàn mặc định");
    }

    @Test
    @DisplayName("Cloud AI trả về null -> Trả về kết quả an toàn mặc định")
    void executeFundusAnalysis_whenNullResult_returnsFallbackDefault() {
      when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(null);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-NULL", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(45);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("MODERATE");
      assertThat(result.xaiRationales()).contains("Phân tích an toàn mặc định");
    }

    @Test
    @DisplayName("Dịch vụ Gemini AI là null (Offline / Service Unavailable) -> Trả về kết quả an toàn mặc định")
    void executeFundusAnalysis_whenServiceNull_returnsFallbackDefault() {
      AiServiceClient offlineClient = new AiServiceClient(null);

      AiInferenceResultDto result = offlineClient.executeFundusAnalysis("PSEUDO-OFFLINE", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(45);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo("MODERATE");
      assertThat(result.xaiRationales()).contains("Phân tích an toàn mặc định");
    }
  }
}
