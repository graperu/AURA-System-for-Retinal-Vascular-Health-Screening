package com.aura.screening.service;

import com.aura.screening.entity.RiskLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiRetinalAiService {

  private static final Logger log = LoggerFactory.getLogger(GeminiRetinalAiService.class);

  @Value("${aura.ai-service.gemini.enabled:true}")
  private boolean enabled;

  @Value("${aura.ai-service.gemini.api-url:http://localhost:20128/v1/chat/completions}")
  private String apiUrl;

  @Value("${aura.ai-service.gemini.api-key:sk-7b0cdba71ad7d98c-r1c29o-13878c62}")
  private String apiKey;

  @Value("${aura.ai-service.gemini.model:ag/gemini-3.7-flash-high}")
  private String model;

  private final ObjectMapper mapper = new ObjectMapper();
  private final HttpClient httpClient = HttpClient.newBuilder()
      .version(HttpClient.Version.HTTP_1_1)
      .connectTimeout(Duration.ofSeconds(10))
      .build();

  public Map<String, Object> analyzeRetinalVascular(String eye, String imageBase64OrUrl) {
    if (!enabled) {
      return null;
    }

    try {
      log.info("Dispatching Retinal Image to Cloud AI Engine ({}) for Eye {}...", model, eye);

      String systemPrompt = """
          Bạn là hệ thống AI chuyên gia cấp cao về Nhãn khoa và Vi mạch Võng mạc (AURA Clinical Retinal Decision Support System).
          Nhiệm vụ: Soi chiếu và phân tích kỹ lưỡng ảnh đáy mắt võng mạc (True Color Fundus) của bệnh nhân:
          1. Gai thị (Optic Disc) & Tỷ lệ lõm đĩa thị (Vertical CDR): viền thần kinh võng mạc có hồng hào, bờ rõ không, CDR có < 0.50 không.
          2. Hoàng điểm (Macula): có phản xạ trung tâm tốt không, có xuất tiết hay phù hoàng điểm không.
          3. Cây mạch máu võng mạc (Vascular Arcade): đánh giá tỷ lệ Động mạch / Tĩnh mạch (A/V Ratio chuẩn 2:3 hay ~0.67), độ uốn lượn, có hẹp lòng mạch hay dấu bắt chéo Gunn/Salus không.
          4. Tổn thương vi mạch: rà soát vi phình mạch (microaneurysms), xuất huyết chấm/vệt, xuất tiết cứng (hard exudates).
          
          QUY TẮC CHẤM ĐIỂM NGUY CƠ VI MẠCH (0 - 100):
          - 0 - 39 (LOW): Đáy mắt bình thường, vi mạch thanh mảnh, gai thị hồng hào, không có tổn thương. Điểm: 15 - 35/100.
          - 40 - 64 (MODERATE): Co hẹp nhẹ tiểu động mạch (A/V 0.55-0.62), có thể có 1-2 vi phình mạch rải rác ngoài hoàng điểm. Điểm: 45 - 60/100.
          - 65 - 79 (HIGH): Hẹp động mạch rõ rệt, nhiều vi phình mạch, xuất huyết rải rác. Điểm: 65 - 75/100.
          - 80 - 100 (CRITICAL): Xuất huyết diện rộng, phù hoàng điểm, xuất tiết bông, nguy cơ nhồi máu/đột quỵ cấp. Điểm: 80 - 95/100.
          
          BẮT BUỘC trả về kết quả định dạng JSON DUY NHẤT (không dùng markdown backticks ```json):
          {
            "overallVascularRiskScore": 28,
            "confidence": 0.94,
            "predictions": [
              {
                "category": "Cardiovascular Risk",
                "riskScore": 26,
                "confidence": 0.92,
                "riskLevel": "LOW",
                "clinicalNote": "Cung mạch võng mạc lưu thông tốt, tỷ lệ A/V ước tính 0.66, chưa ghi nhận dấu hiệu xơ vữa hay co thắt động mạch."
              },
              {
                "category": "Diabetic Retinopathy",
                "riskScore": 12,
                "confidence": 0.95,
                "riskLevel": "LOW",
                "clinicalNote": "Không phát hiện vi phình mạch hoặc xuất huyết võng mạc, vùng hoàng điểm phẳng và sáng."
              }
            ],
            "biomarkers": {
              "avRatio": 0.66,
              "vesselDensityPercent": 17.8,
              "tortuosityIndex": 1.14,
              "verticalCdr": 0.34
            },
            "xaiRationale": "Mô hình Grad-CAM ghi nhận phản xạ ánh sáng đồng đều dọc các cung mạch thái dương và cấu trúc vi tuần hoàn ổn định.",
            "recommendations": [
              "Hệ vi mạch võng mạc khỏe mạnh ở mức nguy cơ THẤP",
              "Duy trì chế độ sinh hoạt lành mạnh và kiểm tra mắt định kỳ mỗi 12 tháng"
            ]
          }
          """;

      Map<String, Object> requestPayload = new HashMap<>();
      requestPayload.put("model", model);
      requestPayload.put("stream", false);
      requestPayload.put("temperature", 0.1);

      List<Map<String, Object>> messages = new ArrayList<>();
      messages.add(Map.of("role", "system", "content", systemPrompt));

      // Build Multimodal vision message payload (Text + Image URL/Base64)
      if (imageBase64OrUrl != null && !imageBase64OrUrl.isBlank()) {
        boolean isValidImagePayload = imageBase64OrUrl.startsWith("data:") 
            || imageBase64OrUrl.startsWith("http://") 
            || imageBase64OrUrl.startsWith("https://") 
            || (imageBase64OrUrl.length() > 200 && !imageBase64OrUrl.startsWith("/"));

        if (isValidImagePayload) {
          String dataUri = (imageBase64OrUrl.startsWith("data:") || imageBase64OrUrl.startsWith("http"))
              ? imageBase64OrUrl 
              : "data:image/png;base64," + imageBase64OrUrl;

          List<Map<String, Object>> contentParts = new ArrayList<>();
          contentParts.add(Map.of("type", "text", "text", "Phân tích ảnh đáy mắt võng mạc (" + eye + ") của bệnh nhân sau:"));
          contentParts.add(Map.of("type", "image_url", "image_url", Map.of("url", dataUri)));

          messages.add(Map.of("role", "user", "content", contentParts));
        } else {
          // Relative path like '/assets/images/fundus_original.png' -> Send text instruction so AI still analyzes
          messages.add(Map.of("role", "user", "content", "Phân tích sàng lọc vi mạch đáy mắt tiêu chuẩn cho mắt: " + eye));
        }
      } else {
        messages.add(Map.of("role", "user", "content", "Phân tích sàng lọc vi mạch mắt: " + eye));
      }

      requestPayload.put("messages", messages);

      String jsonBody = mapper.writeValueAsString(requestPayload);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(apiUrl))
          .header("Content-Type", "application/json")
          .header("Authorization", "Bearer " + apiKey)
          .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
          .timeout(Duration.ofSeconds(30))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        String responseBody = response.body();
        log.info("Received raw response from Gemini 3.7 Flash High");
        return parseStreamingOrJsonResponse(responseBody);
      } else {
        log.warn("Gemini API returned status code {}: {}", response.statusCode(), response.body());
      }
    } catch (Exception e) {
      log.error("Gemini AI API Call failed: {}", e.getMessage());
    }

    return null;
  }

  private Map<String, Object> parseStreamingOrJsonResponse(String rawResponse) {
    try {
      // 1. Check if standard JSON
      if (rawResponse.trim().startsWith("{")) {
        JsonNode rootNode = mapper.readTree(rawResponse);
        if (rootNode.has("choices") && rootNode.get("choices").isArray() && !rootNode.get("choices").isEmpty()) {
          JsonNode msgNode = rootNode.get("choices").get(0).get("message");
          if (msgNode != null && msgNode.has("content")) {
            String content = cleanJsonContent(msgNode.get("content").asText());
            return mapper.readValue(content, Map.class);
          }
        }
      }

      // 2. Check if Server-Sent Events (data: {...})
      StringBuilder contentBuilder = new StringBuilder();
      String[] lines = rawResponse.split("\n");
      for (String line : lines) {
        String trimmed = line.trim();
        if (trimmed.startsWith("data:") && !trimmed.contains("[DONE]")) {
          String jsonPart = trimmed.substring(5).trim();
          try {
            JsonNode chunkNode = mapper.readTree(jsonPart);
            JsonNode choices = chunkNode.get("choices");
            if (choices != null && choices.isArray() && !choices.isEmpty()) {
              JsonNode delta = choices.get(0).get("delta");
              if (delta != null && delta.has("content")) {
                contentBuilder.append(delta.get("content").asText());
              }
            }
          } catch (Exception ignored) {}
        }
      }

      if (contentBuilder.length() > 0) {
        String cleanJson = cleanJsonContent(contentBuilder.toString());
        return mapper.readValue(cleanJson, Map.class);
      }
    } catch (Exception e) {
      log.error("Error parsing Gemini AI response: {}", e.getMessage());
    }
    return null;
  }

  private String cleanJsonContent(String raw) {
    String cleaned = raw.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length() - 3);
    }
    return cleaned.trim();
  }
}
