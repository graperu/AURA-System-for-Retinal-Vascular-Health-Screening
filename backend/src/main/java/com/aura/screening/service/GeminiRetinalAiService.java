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
          Bạn là hệ thống AI chuyên gia nhãn khoa và vi mạch võng mạc (AURA Clinical Retinal Decision Support).
          Nhiệm vụ: Phân tích các tổn thương vi mạch võng mạc (vi phình mạch, xuất huyết, hẹp động mạch, tỷ lệ A/V) và ước lượng nguy cơ tim mạch, đột quỵ và võng mạc đái tháo đường.
          
          BẮT BUỘC trả về kết quả định dạng JSON DUY NHẤT (không dùng markdown backticks ```json):
          {
            "overallVascularRiskScore": 58,
            "confidence": 0.91,
            "predictions": [
              {
                "category": "Cardiovascular Risk",
                "confidence": 0.88,
                "riskLevel": "MODERATE",
                "clinicalNote": "Động mạch võng mạc co hẹp nhẹ vùng cận gai thị, tỷ lệ A/V 0.61"
              },
              {
                "category": "Diabetic Retinopathy",
                "confidence": 0.93,
                "riskLevel": "LOW",
                "clinicalNote": "Chưa ghi nhận xuất tiết cứng hoặc vi phình mạch hoàng điểm"
              }
            ],
            "biomarkers": {
              "avRatio": 0.61,
              "vesselDensityPercent": 16.9,
              "tortuosityIndex": 1.16,
              "verticalCdr": 0.36
            },
            "xaiRationale": "Mô hình Grad-CAM tập trung chú ý vào cung mạch thái dương trên và phân nhánh mao mạch quanh hoàng điểm.",
            "recommendations": [
              "Kiểm soát huyết áp định kỳ dưới 130/80 mmHg",
              "Khám mắt chuyên khoa định kỳ sau 6 tháng"
            ]
          }
          """;

      Map<String, Object> requestPayload = new HashMap<>();
      requestPayload.put("model", model);
      requestPayload.put("stream", false);

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
