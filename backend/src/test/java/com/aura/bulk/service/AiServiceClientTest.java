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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
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

    @ParameterizedTest(name = "Heatmap blank fallback: ''{0}'' -> heatmapOverlayBase64 is null")
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t\n"})
    @DisplayName("Heatmap null hoặc blank -> kết quả heatmapOverlayBase64 là null")
    void executeFundusAnalysis_whenHeatmapNullOrBlank_returnsNullInDto(String blankHeatmap) {
      Map<String, Object> aiResult = new HashMap<>();
      aiResult.put("overallVascularRiskScore", 60);
      aiResult.put("heatmapBase64", blankHeatmap);
      when(geminiAiService.analyzeRetinalVascular("OD", "b64")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-HEATMAP-NULL", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.heatmapOverlayUrl()).isNull();
    }

    @Test
    @DisplayName("Heatmap hợp lệ -> trả về đúng chuỗi Base64 heatmap trong DTO")
    void executeFundusAnalysis_whenHeatmapValid_returnsHeatmapInDto() {
      Map<String, Object> aiResult = new HashMap<>();
      aiResult.put("overallVascularRiskScore", 75);
      aiResult.put("heatmapBase64", "data:image/png;base64,VALID_HEATMAP_DATA");
      when(geminiAiService.analyzeRetinalVascular("OS", "b64")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-HEATMAP-OK", "OS", "b64");

      assertThat(result).isNotNull();
      assertThat(result.heatmapOverlayUrl()).isEqualTo("data:image/png;base64,VALID_HEATMAP_DATA");
    }

    @ParameterizedTest(name = "Risk boundary: score={0} -> level=''{1}''")
    @CsvSource({
      "80, 'CRITICAL'",
      "79, 'HIGH'",
      "65, 'HIGH'",
      "64, 'MODERATE'",
      "40, 'MODERATE'",
      "39, 'LOW'",
      "0, 'LOW'"
    })
    @DisplayName("Kiểm tra phân loại mức độ rủi ro tại các ngưỡng biên 80, 65, 40")
    void executeFundusAnalysis_riskLevelBoundaries(int score, String expectedLevel) {
      Map<String, Object> aiResult = new HashMap<>();
      aiResult.put("overallVascularRiskScore", score);
      when(geminiAiService.analyzeRetinalVascular("OD", "b64")).thenReturn(aiResult);

      AiInferenceResultDto result = client.executeFundusAnalysis("PSEUDO-BOUND", "OD", "b64");

      assertThat(result).isNotNull();
      assertThat(result.overallVascularRiskScore()).isEqualTo(score);
      assertThat(result.cardiovascularRiskLevel()).isEqualTo(expectedLevel);
    }
  }

  @Nested
  @DisplayName("Xử lý lỗi và cơ chế an toàn dự phòng (Fail-Safe & Timeout Handling)")
  class FailSafeAndTimeoutTests {

    @Test
    @DisplayName("Timeout khi gọi Cloud AI API -> Ném ngoại lệ để xử lý FAILED (Không dùng Mock Data)")
    void executeFundusAnalysis_whenTimeout_throwsException() {
      when(geminiAiService.analyzeRetinalVascular(anyString(), anyString()))
          .thenThrow(new RuntimeException("Connection timed out after 30000ms"));

      org.assertj.core.api.Assertions.assertThatThrownBy(() ->
          client.executeFundusAnalysis("PSEUDO-TIMEOUT", "OD", "b64")
      ).isInstanceOf(IllegalStateException.class)
       .hasMessageContaining("AI inference execution failed");
    }

    @Test
    @DisplayName("Cloud AI trả về null -> Ném ngoại lệ để xử lý FAILED (Không dùng Mock Data)")
    void executeFundusAnalysis_whenNullResult_throwsException() {
      when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(null);

      org.assertj.core.api.Assertions.assertThatThrownBy(() ->
          client.executeFundusAnalysis("PSEUDO-NULL", "OD", "b64")
      ).isInstanceOf(IllegalStateException.class)
       .hasMessageContaining("AI engine returned null response or analysis failed");
    }

    @Test
    @DisplayName("Dịch vụ Gemini AI là null (Offline / Service Unavailable) -> Ném ngoại lệ")
    void executeFundusAnalysis_whenServiceNull_throwsException() {
      AiServiceClient offlineClient = new AiServiceClient(null);

      org.assertj.core.api.Assertions.assertThatThrownBy(() ->
          offlineClient.executeFundusAnalysis("PSEUDO-OFFLINE", "OD", "b64")
      ).isInstanceOf(IllegalStateException.class)
       .hasMessageContaining("AI Service is unavailable or offline");
    }
  }
}
