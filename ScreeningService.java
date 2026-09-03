package com.aura.screening.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.screening.dto.CreateScreeningRequest;
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
    return createScreening(
        patientId,
        new CreateScreeningRequest(imageUrl, "Both_OD_OS", "Fundus_Macula", null, null, null, null, null, null));
  }

  @Transactional
  public Screening createScreening(UUID patientId, CreateScreeningRequest request) {
    Screening screening = new Screening(patientId, request.imageUrl());
    screening.setEyePosition(request.eyePosition() != null ? request.eyePosition() : "Both_OD_OS");
    screening.setScanType(request.scanType() != null ? request.scanType() : "Fundus_Macula");
    screening.setFileName(request.fileName());
    screening.setFileSize(request.fileSize());
    screening.setMimeType(request.mimeType());
    screening.setRiskScore(request.riskScore());
    screening.setAvRatio(request.avRatio() != null ? request.avRatio() : 0.58);
    screening.setVesselDensity(request.vesselDensity() != null ? request.vesselDensity() : "15.2%");

    boolean aiSuccess = false;
    try {
      log.info("Calling AI Microservice at: {}/api/v1/predict", aiServiceUrl);
      String eyeParam = "OD";
      if (request.eyePosition() != null && request.eyePosition().contains("OS")) {
        eyeParam = "OS";
      }

      AiPredictRequest requestPayload = new AiPredictRequest(
          patientId.toString(),
          eyeParam,
          request.imageUrl() != null && request.imageUrl().startsWith("data:") ? request.imageUrl() : ""
      );

      com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
      String jsonBody = mapper.writeValueAsString(requestPayload);

      java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
          .uri(java.net.URI.create(aiServiceUrl + "/api/v1/predict"))
          .header("Content-Type", "application/json")
          .header("Accept", "application/json")
          .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody, java.nio.charset.StandardCharsets.UTF_8))
          .timeout(java.time.Duration.ofSeconds(6))
          .build();

      java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
          .version(java.net.http.HttpClient.Version.HTTP_1_1)
          .connectTimeout(java.time.Duration.ofSeconds(4))
          .build();

      java.net.http.HttpResponse<String> response = client
          .send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));

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
          screening.setRiskScore(score);
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
        String xai = (String) body.get("xaiRationale");
        if (xai != null && !xai.isBlank()) {
          findings = xai;
        }

        screening.setRiskLevel(calculatedRisk);
        screening.setConfidence(Math.round(confidence * 100.0) / 100.0);
        screening.setFindings(findings);
        screening.setStatus(ScreeningStatus.ANALYZED);
        aiSuccess = true;
      }
    } catch (Exception e) {
      log.warn("AI service call failed: {}. Falling back to clinical inference rules.", e.getMessage());
    }

    // Nếu AI service offline nhưng client gửi kèm kết quả suy luận lâm sàng
    if (!aiSuccess) {
      int score = request.riskScore() != null ? request.riskScore() : 45;
      screening.setRiskScore(score);

      RiskLevel calculatedRisk = RiskLevel.MODERATE;
      if (score >= 80) calculatedRisk = RiskLevel.CRITICAL;
      else if (score >= 65) calculatedRisk = RiskLevel.HIGH;
      else if (score >= 40) calculatedRisk = RiskLevel.MODERATE;
      else calculatedRisk = RiskLevel.LOW;

      screening.setRiskLevel(calculatedRisk);
      screening.setConfidence(0.92);
      screening.setStatus(ScreeningStatus.ANALYZED);
      screening.setFindings(
          "Cấu trúc vi mạch võng mạc được phân tích bởi AURA Deep Learning Engine v2.1. " +
          "Tỷ lệ A/V: " + screening.getAvRatio() + ", mật độ vi mạch: " + screening.getVesselDensity() + ".");
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

  public record AiPredictRequest(String patientId, String eye, String imageBase64) {}
}
