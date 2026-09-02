package com.aura.screening.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class ScreeningService {

  private static final Logger log = LoggerFactory.getLogger(ScreeningService.class);

  private final ScreeningRepository screeningRepository;
  private final RestClient restClient;

  @Value("${aura.ai-service.url:http://localhost:8000}")
  private String aiServiceUrl;

  public ScreeningService(ScreeningRepository screeningRepository, RestClient.Builder restClientBuilder) {
    this.screeningRepository = screeningRepository;
    this.restClient = restClientBuilder.build();
  }

  @Transactional
  public Screening createScreening(UUID patientId, String imageUrl) {
    Screening screening = new Screening(patientId, imageUrl);

    try {
      log.info("Calling AI Microservice at: {}/api/v1/predict", aiServiceUrl);
      AiPredictRequest requestPayload = new AiPredictRequest(
          patientId.toString(),
          "OD",
          imageUrl != null && imageUrl.startsWith("data:") ? imageUrl : ""
      );

      com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
      String jsonBody = mapper.writeValueAsString(requestPayload);

      java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
          .uri(java.net.URI.create(aiServiceUrl + "/api/v1/predict"))
          .header("Content-Type", "application/json")
          .header("Accept", "application/json")
          .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody, java.nio.charset.StandardCharsets.UTF_8))
          .timeout(java.time.Duration.ofSeconds(10))
          .build();

      java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
          .version(java.net.http.HttpClient.Version.HTTP_1_1)
          .connectTimeout(java.time.Duration.ofSeconds(5))
          .build();

      java.net.http.HttpResponse<String> response = client
          .send(request, java.net.http.HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));

      if (response.statusCode() >= 200 && response.statusCode() < 300 && response.body() != null) {
        Map body = mapper.readValue(response.body(), Map.class);
        log.info("Received AI response: {}", body);

        RiskLevel calculatedRisk = RiskLevel.MODERATE;
        Number overallRisk = (Number) body.get("overallVascularRiskScore");
        if (overallRisk == null) {
          overallRisk = (Number) body.get("overallRiskScore");
        }
        if (overallRisk != null) {
          int score = overallRisk.intValue();
          if (score >= 80) calculatedRisk = RiskLevel.CRITICAL;
          else if (score >= 65) calculatedRisk = RiskLevel.HIGH;
          else if (score >= 40) calculatedRisk = RiskLevel.MODERATE;
          else calculatedRisk = RiskLevel.LOW;
        }

        double confidence = 0.92;
        Number conf = (Number) body.get("confidence");
        if (conf != null) {
          confidence = conf.doubleValue();
        }

        String findings = "Cấu trúc vi mạch võng mạc được phân tích bởi mô hình AURA AI. Đang giám sát nguy cơ tim mạch và tiểu đường.";

        // --- FR-3: parse per-category risk breakdown from the AI Core's `predictions` array ---
        List<Map> predictions = (List<Map>) body.get("predictions");
        if (predictions != null) {
          for (Map prediction : predictions) {
            String category = String.valueOf(prediction.get("category"));
            Number predConfidence = (Number) prediction.get("confidence");
            int predScore = predConfidence != null ? (int) Math.round(predConfidence.doubleValue() * 100) : 0;
            String predRiskLevel = String.valueOf(prediction.get("riskLevel"));
            String clinicalNote = (String) prediction.get("clinicalNote");

            if (category.contains("Cardiovascular") || category.contains("Hypertensive")) {
              screening.setCardiovascularRiskScore(predScore);
              screening.setCardiovascularRiskLevel(predRiskLevel);
              // The AI Core does not yet expose a dedicated stroke classifier: the 3-year
              // stroke risk is derived from the same cardiovascular/hypertensive prediction
              // until a standalone model is trained (see model_engine.py).
              screening.setStrokeRiskScore(predScore);
              screening.setStrokeRiskLevel(predRiskLevel);
              screening.setHypertensionRiskScore(predScore);
              screening.setHypertensionRiskLevel(predRiskLevel);
              if (clinicalNote != null && !clinicalNote.isBlank()) {
                findings = clinicalNote;
              }
            } else if (category.contains("Diabetic Retinopathy")) {
              screening.setDiabeticRetinopathyRiskScore(predScore);
              screening.setDiabeticRetinopathyRiskLevel(predRiskLevel);
            }
          }
        }

        // --- FR-3 / FR-4: parse retinal vascular biomarkers ---
        Map biomarkers = (Map) body.get("biomarkers");
        if (biomarkers != null) {
          screening.setAvRatio(toDouble(biomarkers.get("avRatio")));
          screening.setVesselDensityPercent(toDouble(biomarkers.get("vesselDensityPercent")));
          screening.setTortuosityIndex(toDouble(biomarkers.get("tortuosityIndex")));
          screening.setVerticalCdr(toDouble(biomarkers.get("verticalCdr")));
        }

        // --- FR-4: persist the Grad-CAM heatmap overlay ---
        String heatmapBase64 = (String) body.get("heatmapBase64");
        if (heatmapBase64 != null && !heatmapBase64.isBlank()) {
          screening.setHeatmapBase64(heatmapBase64);
        }

        screening.setRiskLevel(calculatedRisk);
        screening.setConfidence(Math.round(confidence * 100.0) / 100.0);
        screening.setFindings(findings);
        // --- FR-5: auto-generate health recommendations/warnings from the computed risk level ---
        screening.setRecommendations(generateRecommendations(calculatedRisk));
        screening.setStatus(ScreeningStatus.ANALYZED);
      } else {
        log.warn("AI service returned non-successful response or empty body");
        screening.setStatus(ScreeningStatus.FAILED);
        screening.setRiskLevel(null);
        screening.setConfidence(null);
        screening.setFindings("Dịch vụ AI trả về kết quả không hợp lệ. Ảnh chụp đã được lưu trữ an toàn.");
      }
    } catch (Exception e) {
      log.error("AI service call failed (server offline or inference error): {}", e.getMessage());
      screening.setStatus(ScreeningStatus.FAILED);
      screening.setRiskLevel(null);
      screening.setConfidence(null);
      screening.setFindings("Không thể kết nối đến máy chủ phân tích AI. Ảnh chụp võng mạc đã được lưu trữ an toàn để thẩm định lại.");
    }

    return screeningRepository.save(screening);
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForPatient(UUID patientId) {
    return screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
  }

  @Transactional(readOnly = true)
  public List<Screening> getAllScreenings() {
    return screeningRepository.findAllByOrderByCreatedAtDesc();
  }

  @Transactional(readOnly = true)
  public Screening getScreeningById(UUID id) {
    return screeningRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Ca sàng lọc không tồn tại với ID: " + id));
  }

  @Transactional
  public Screening addDoctorReview(UUID screeningId, UUID doctorId, String doctorNotes, RiskLevel updatedRiskLevel) {
    Screening screening = getScreeningById(screeningId);
    screening.setDoctorId(doctorId);
    screening.setDoctorNotes(doctorNotes);
    if (updatedRiskLevel != null) {
      screening.setRiskLevel(updatedRiskLevel);
    }
    screening.setStatus(ScreeningStatus.REVIEWED);
    return screeningRepository.save(screening);
  }

  /**
   * FR-5: Khuyến nghị & Cảnh báo sức khỏe tự động.
   * Sinh danh mục lời khuyên y tế dựa trên mức độ rủi ro tổng thể do AI tính toán.
   * Đây là gợi ý sàng lọc ban đầu, không thay thế chỉ định điều trị của bác sĩ.
   */
  private String generateRecommendations(RiskLevel riskLevel) {
    if (riskLevel == null) {
      return "Không thể sinh khuyến nghị do dữ liệu phân tích chưa đầy đủ. Vui lòng chụp lại ảnh võng mạc hoặc liên hệ phòng khám.";
    }
    return switch (riskLevel) {
      case CRITICAL -> "Nguy cơ RẤT CAO: Khuyến nghị đặt lịch khám chuyên khoa Mắt/Tim mạch trong vòng 24-48 giờ. "
          + "Theo dõi huyết áp và đường huyết hằng ngày. Tránh vận động gắng sức cho đến khi có đánh giá của bác sĩ.";
      case HIGH -> "Nguy cơ CAO: Nên đặt lịch tái khám trong vòng 1-2 tuần để bác sĩ xác nhận kết quả. "
          + "Kiểm soát chặt huyết áp, đường huyết và mỡ máu. Hạn chế muối, hạn chế thuốc lá/rượu bia.";
      case MODERATE -> "Nguy cơ TRUNG BÌNH: Duy trì tái khám định kỳ mỗi 3-6 tháng. "
          + "Xây dựng chế độ ăn uống lành mạnh, vận động đều đặn và theo dõi các chỉ số tim mạch, đường huyết.";
      case LOW -> "Nguy cơ THẤP: Chưa phát hiện dấu hiệu bất thường đáng lo ngại. "
          + "Duy trì khám sàng lọc định kỳ hằng năm và lối sống lành mạnh để phòng ngừa.";
    };
  }

  private Double toDouble(Object value) {
    if (value instanceof Number number) {
      return number.doubleValue();
    }
    return null;
  }

  public record AiPredictRequest(String patientId, String eye, String imageBase64) {}
}
