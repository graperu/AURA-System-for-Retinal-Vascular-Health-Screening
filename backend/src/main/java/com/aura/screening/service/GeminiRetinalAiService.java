package com.aura.screening.service;

import com.aura.screening.entity.RiskLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiRetinalAiService {

  private static final Logger log = LoggerFactory.getLogger(GeminiRetinalAiService.class);

  public static final Set<String> ALLOWED_EYE_POSITIONS = Set.of(
      "OD", "OS", "OU", "LEFT_EYE", "RIGHT_EYE", "UNKNOWN"
  );

  public static String sanitizeEyePosition(String rawEye) {
    if (rawEye == null || rawEye.isBlank()) {
      return "UNKNOWN";
    }
    String trimmed = rawEye.trim();
    // Neutralize prompt injection vectors (newlines, control characters, quotes, excessive length)
    if (trimmed.length() > 20 || trimmed.contains("\n") || trimmed.contains("\r") || trimmed.contains("\"") || trimmed.contains(";")) {
      log.warn("[AI-01 Security] Potential prompt injection detected in eyePosition parameter: '{}'. Neutralizing to UNKNOWN.", trimmed);
      return "UNKNOWN";
    }
    String upper = trimmed.toUpperCase(Locale.ROOT);
    if (ALLOWED_EYE_POSITIONS.contains(upper)) {
      return upper;
    }
    // Normalize valid clinical aliases safely
    return switch (upper) {
      case "RIGHT", "RIGHT_OD", "MAT_PHAI", "R" -> "OD";
      case "LEFT", "LEFT_OS", "MAT_TRAI", "L" -> "OS";
      case "BOTH", "BOTH_EYES", "HAI_MAT" -> "OU";
      default -> {
        log.warn("[AI-01 Security] Unrecognized eyePosition '{}'. Defaulting to UNKNOWN.", rawEye);
        yield "UNKNOWN";
      }
    };
  }

  @Value("${aura.ai-service.gemini.enabled:true}")
  private boolean enabled;

  @Value("${aura.ai-service.gemini.api-url:http://localhost:20128/v1/chat/completions}")
  private String apiUrl;

  @Value("${aura.ai-service.gemini.api-key:}")
  private String apiKey;

  @Value("${aura.ai-service.gemini.model:ag/gemini-3.8-flash-high}")
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

    String sanitizedEye = sanitizeEyePosition(eye);

    try {
      log.info("Dispatching Retinal Image to Cloud AI Engine ({}) for Eye {}...", model, sanitizedEye);

      String systemPrompt = """
          Bạn là hệ thống AI chuyên gia cấp cao về Nhãn khoa và Vi mạch Võng mạc (AURA Clinical Retinal Decision Support System).
          Nhiệm vụ: Soi chiếu và phân tích kỹ lưỡng ảnh đáy mắt võng mạc (True Color Fundus) của bệnh nhân được cung cấp:
          1. Gai thị (Optic Disc) & Tỷ lệ lõm đĩa thị (Vertical CDR): viền thần kinh võng mạc, CDR (bình thường < 0.50, nghi ngờ glôcôm nếu >= 0.60).
          2. Hoàng điểm (Macula): phản xạ trung tâm, phù hoàng điểm, xuất tiết cứng hay xuất huyết quanh hoàng điểm.
          3. Cây mạch máu võng mạc (Vascular Arcade): đánh giá tỷ lệ Động mạch / Tĩnh mạch (A/V Ratio bình thường ~0.65 - 0.67, co hẹp nếu < 0.60), độ xoắn vặn (tortuosity), dấu bắt chéo Gunn/Salus.
          4. Rà soát kỹ lưỡng các tổn thương vi mạch thực tế trên ảnh:
             - Vi phình mạch (Microaneurysm): các chấm đỏ li ti tròn, bờ rõ, đường kính nhỏ (< 125µm).
             - Xuất huyết võng mạc (Hemorrhage): đốm xuất huyết ngọn lửa hoặc chấm/vệt dọc theo sợi thần kinh.
             - Xuất tiết cứng (Hard_Exudate): các mảng/đốm màu vàng sáng có bờ sắc nét quanh hoàng điểm hoặc cung mạch.
             - Bắt chéo động - tĩnh mạch (AV_Nipping): co thắt hoặc đè bẹp tĩnh mạch tại vị trí bắt chéo.
             - Co thắt khu trú (Focal_Narrowing): lòng tiểu động mạch bị thu hẹp cục bộ.
          5. Định vị chính xác mốc giải phẫu học đáy mắt (anatomicalLandmarks):
             - Gai thị (opticDisc): Vùng đĩa thị sáng tròn/bầu dục hội tụ các thân mạch máu chính.
               + Với Mắt Phải (OD): Gai thị nằm ở phía mũi (bên phải ảnh, x: 62.0% - 76.0%, y: 46.0% - 56.0%).
               + Với Mắt Trái (OS): Gai thị nằm ở phía mũi (bên trái ảnh, x: 24.0% - 38.0%, y: 46.0% - 56.0%).
             - Hố hoàng điểm (fovea): Vùng vô mạch sắc tố sẫm trung tâm hoàng điểm, nằm về phía thái dương so với gai thị:
               + Với Mắt Phải (OD): Nằm bên trái gai thị (x: 38.0% - 48.0%, y: 48.0% - 55.0%).
               + Với Mắt Trái (OS): Nằm bên phải gai thị (x: 52.0% - 62.0%, y: 48.0% - 55.0%).
          6. Bản đồ tọa độ tổn thương vi mạch (detectedAnomalies):
             - ĐỊNH VỊ CHÍNH XÁC tọa độ (x, y theo % từ 0 - 100) của TỪNG tổn thương bệnh lý nhìn thấy trên ảnh.
             - Tuyệt đối KHÔNG gắn gai thị hay hoàng điểm thành tổn thương (anomaly).
             - Ví dụ:
               "detectedAnomalies": [
                 {
                   "id": "ANO-01",
                   "type": "Microaneurysm",
                   "coordinates": { "x": 62.4, "y": 41.8, "width": 24, "height": 24 },
                   "confidence": 0.92,
                   "description": "Vi phình mạch nhỏ tại cung mạch thái dương trên."
                 },
                 {
                   "id": "ANO-02",
                   "type": "Hard_Exudate",
                   "coordinates": { "x": 55.2, "y": 48.6, "width": 28, "height": 28 },
                   "confidence": 0.89,
                   "description": "Cụm xuất tiết cứng màu vàng tại vùng cạnh hoàng điểm."
                 }
               ]
             - Quy định rõ 5 loại tổn thương lâm sàng (type): "Microaneurysm", "Hemorrhage", "Hard_Exudate", "AV_Nipping", "Focal_Narrowing".
             - CHỈ TRẢ VỀ "detectedAnomalies": [] KHI VÀ CHỈ KHI đáy mắt hoàn toàn trong sáng, tuyệt đối không có bất kỳ chấm xuất huyết, vi phình mạch hay xuất tiết nào.
          
          QUY TẮC CHẤM ĐIỂM NGUY CƠ VI MẠCH (0 - 100):
          - 0 - 39 (LOW): Đáy mắt bình thường, vi mạch thanh mảnh, gai thị hồng hào, không có tổn thương nào (0 tổn thương). Điểm: 15 - 35/100.
          - 40 - 64 (MODERATE): Co hẹp nhẹ tiểu động mạch (A/V 0.55-0.62), có 1-3 vi phình mạch hoặc xuất tiết rải rác ngoài hoàng điểm. Điểm: 45 - 60/100. Phân loại NPDR nhẹ - trung bình.
          - 65 - 79 (HIGH): Hẹp động mạch rõ rệt, nhiều vi phình mạch, xuất huyết dạng chấm/vệt, xuất tiết cứng gom cụm. Điểm: 65 - 75/100. Phân loại NPDR nặng.
          - 80 - 100 (CRITICAL): Xuất huyết diện rộng, xuất huyết trước võng mạc, phù hoàng điểm nặng, tân mạch (PDR), nguy cơ đột quỵ/mù lòa cấp. Điểm: 80 - 95/100.
          
          - Phân loại bệnh võng mạc đái tháo đường (Diabetic Retinopathy) bắt buộc tuân theo tiêu chuẩn ETDRS / AAO (Quy tắc 4-2-1):
            + Cấp độ 0 (Không DR): Hoàn toàn không có tổn thương.
            + Cấp độ 1 (NPDR nhẹ): Chỉ có vi phình mạch (Microaneurysm).
            + Cấp độ 2 (NPDR trung bình): Nhiều hơn vi phình mạch nhưng chưa thỏa quy tắc 4-2-1.
            + Cấp độ 3 (NPDR nặng - Tiền tăng sinh): Thỏa quy tắc 4-2-1 (Xuất huyết ở 4 góc phần tư, hoặc chuỗi hạt tĩnh mạch ở 2 góc, hoặc IRMA ở 1 góc).
            + Cấp độ 4 (PDR - Tăng sinh): Có tân mạch (Neovascularization NVD/NVE) hoặc xuất huyết dịch kính/trước võng mạc.
          
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
                "category": "Stroke Risk",
                "riskScore": 18,
                "confidence": 0.90,
                "riskLevel": "LOW",
                "clinicalNote": "Không phát hiện dấu hiệu co thắt cục bộ (Focal Narrowing) hay bắt chéo động-tĩnh mạch (AV Nipping)."
              },
              {
                "category": "Diabetic Retinopathy",
                "riskScore": 12,
                "confidence": 0.95,
                "riskLevel": "LOW",
                "etdrsGrade": "Cấp độ 0 (Không DR)",
                "clinicalNote": "Không phát hiện vi phình mạch hoặc xuất huyết võng mạc, vùng hoàng điểm phẳng và sáng."
              }
            ],
            "anatomicalLandmarks": {
              "opticDisc": { "x": 65.4, "y": 52.8, "diameter": 14.0 },
              "fovea": { "x": 42.1, "y": 51.5 }
            },
            "detectedAnomalies": [],
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

          // Apply clinical downscaling with Bicubic anti-aliasing if image exceeds safe transport threshold
          dataUri = optimizeImagePayload(dataUri);

          log.info("Sending multimodal image payload (prefix: {}, len: {}) to Gemini 3.8 Flash High", 
              dataUri.substring(0, Math.min(30, dataUri.length())), dataUri.length());

          List<Map<String, Object>> contentParts = new ArrayList<>();
          contentParts.add(Map.of("type", "text", "text", "Phân tích ảnh đáy mắt võng mạc (" + sanitizedEye + ") của bệnh nhân sau:"));
          contentParts.add(Map.of("type", "image_url", "image_url", Map.of("url", dataUri)));

          messages.add(Map.of("role", "user", "content", contentParts));
        } else {
          // VULN-06 FIX: Tải dữ liệu byte thực tế cho đường dẫn ảnh cục bộ
          String resolvedDataUri = resolveLocalImageToDataUri(imageBase64OrUrl);
          if (resolvedDataUri != null) {
            resolvedDataUri = optimizeImagePayload(resolvedDataUri);
            List<Map<String, Object>> contentParts = new ArrayList<>();
            contentParts.add(Map.of("type", "text", "text", "Phân tích ảnh đáy mắt võng mạc (" + sanitizedEye + ") của bệnh nhân sau:"));
            contentParts.add(Map.of("type", "image_url", "image_url", Map.of("url", resolvedDataUri)));
            messages.add(Map.of("role", "user", "content", contentParts));
          } else {
            messages.add(Map.of("role", "user", "content", "Phân tích sàng lọc vi mạch đáy mắt tiêu chuẩn cho mắt: " + sanitizedEye));
          }
        }
      } else {
        messages.add(Map.of("role", "user", "content", "Phân tích sàng lọc vi mạch mắt: " + sanitizedEye));
      }

      requestPayload.put("messages", messages);

      String jsonBody = mapper.writeValueAsString(requestPayload);

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(apiUrl))
          .header("Content-Type", "application/json")
          .header("Authorization", "Bearer " + apiKey)
          .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
          .timeout(Duration.ofSeconds(45))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        String responseBody = response.body();
        log.info("Received raw response from Gemini 3.8 Flash High");
        return parseStreamingOrJsonResponse(responseBody);
      } else {
        log.warn("Gemini API returned status code {}: {}", response.statusCode(), response.body());
      }
    } catch (Exception e) {
      log.error("Gemini AI API Call failed: {}", e.getMessage(), e);
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
      log.error("Error parsing Gemini AI response: {}", e.getMessage(), e);
    }
    return null;
  }

  public String cleanJsonContent(String raw) {
    if (raw == null) {
      return "";
    }
    String cleaned = raw.trim();

    // 1. If markdown code fence exists, strip code fence
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length() - 3);
    }
    cleaned = cleaned.trim();

    // 2. Locate outermost JSON object braces
    int firstBrace = cleaned.indexOf('{');
    int lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }

    // 3. Remove any trailing commas before } or ] that could break JSON parser
    cleaned = cleaned.replaceAll(",\\s*([}\\]])", "$1");

    return cleaned.trim();
  }

  public String optimizeImagePayload(String dataUri) {
    if (dataUri == null || dataUri.isBlank()) {
      return dataUri;
    }
    // Only optimize if it's a data URI with base64 and length > 2,000,000 chars (~1.5MB)
    if (!dataUri.startsWith("data:") || !dataUri.contains(";base64,") || dataUri.length() < 2_000_000) {
      return dataUri;
    }
    try {
      int commaIndex = dataUri.indexOf(',');
      if (commaIndex == -1) {
        return dataUri;
      }
      String b64Data = dataUri.substring(commaIndex + 1).trim();
      byte[] imageBytes = Base64.getDecoder().decode(b64Data);
      if (imageBytes == null || imageBytes.length < 1_500_000) {
        return dataUri;
      }

      ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes);
      BufferedImage original = ImageIO.read(bais);
      if (original == null) {
        return dataUri;
      }

      int width = original.getWidth();
      int height = original.getHeight();
      int maxDimension = Math.max(width, height);

      // Clinical standard: If dimension exceeds 1536px, downscale with Bicubic anti-aliasing
      if (maxDimension > 1536) {
        double scale = 1536.0 / maxDimension;
        int newWidth = (int) Math.round(width * scale);
        int newHeight = (int) Math.round(height * scale);

        BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.drawImage(original, 0, 0, newWidth, newHeight, null);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        var writers = ImageIO.getImageWritersByFormatName("jpg");
        if (writers.hasNext()) {
          ImageWriter writer = writers.next();
          ImageWriteParam param = writer.getDefaultWriteParam();
          if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(0.92f); // Medical quality retention
          }
          try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(resized, null, null), param);
          }
          writer.dispose();
          byte[] compressedBytes = baos.toByteArray();
          log.info("[AI Vision Optimization] Downscaled large fundus image from {}x{} ({} bytes) to {}x{} ({} bytes) with Bicubic interpolation",
              width, height, imageBytes.length, newWidth, newHeight, compressedBytes.length);
          return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(compressedBytes);
        }
      }
    } catch (Exception e) {
      log.warn("[AI Vision Optimization] Failed to optimize image payload; preserving original: {}", e.getMessage());
    }
    return dataUri;
  }

  private String resolveLocalImageToDataUri(String relativePath) {
    if (relativePath == null || relativePath.isBlank()) {
      return null;
    }
    try {
      String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
      cleanPath = cleanPath.replace("..", "").replaceAll("[/\\\\]+", "/");
      java.nio.file.Path[] candidatePaths = new java.nio.file.Path[] {
          java.nio.file.Paths.get(cleanPath),
          java.nio.file.Paths.get("frontend", "public", cleanPath),
          java.nio.file.Paths.get("..", "frontend", "public", cleanPath),
          java.nio.file.Paths.get("src", "main", "resources", "static", cleanPath)
      };

      for (java.nio.file.Path path : candidatePaths) {
        if (java.nio.file.Files.exists(path) && java.nio.file.Files.isRegularFile(path)) {
          byte[] imageBytes = java.nio.file.Files.readAllBytes(path);
          if (imageBytes.length > 0) {
            String base64 = java.util.Base64.getEncoder().encodeToString(imageBytes);
            String mimeType = cleanPath.endsWith(".jpg") || cleanPath.endsWith(".jpeg") ? "image/jpeg" : "image/png";
            return "data:" + mimeType + ";base64," + base64;
          }
        }
      }
    } catch (Exception e) {
      log.warn("Error reading local image file {}: {}", relativePath, e.getMessage());
    }
    return null;
  }
}
