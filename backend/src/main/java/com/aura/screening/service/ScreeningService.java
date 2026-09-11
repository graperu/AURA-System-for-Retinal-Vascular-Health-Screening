package com.aura.screening.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
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
  private final com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository;
  private final com.aura.notification.service.UserNotificationService userNotificationService;
  private final GeminiRetinalAiService geminiAiService;
  private final RestClient restClient;

  @Value("${aura.signature.secret:AURA_REVIEW_SIGNATURE_SECRET_2026}")
  private String signatureSecret = "AURA_REVIEW_SIGNATURE_SECRET_2026";

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      GeminiRetinalAiService geminiAiService,
      RestClient.Builder restClientBuilder) {
    this.screeningRepository = screeningRepository;
    this.assignmentRepository = assignmentRepository;
    this.userNotificationService = userNotificationService;
    this.geminiAiService = geminiAiService;
    this.restClient = restClientBuilder.build();
  }

  @Transactional
  public Screening createScreening(UUID patientId, com.aura.screening.dto.CreateScreeningRequest request) {
    Screening screening = createScreening(patientId, request.imageUrl());
    if (request.eyePosition() != null) screening.setEyePosition(request.eyePosition());
    if (request.scanType() != null) screening.setScanType(request.scanType());
    if (request.fileName() != null) screening.setFileName(request.fileName());
    if (request.fileSize() != null) screening.setFileSize(request.fileSize());
    if (request.mimeType() != null) screening.setMimeType(request.mimeType());
    if (request.riskScore() != null) screening.setRiskScore(request.riskScore());
    if (request.avRatio() != null) screening.setAvRatio(request.avRatio());
    if (request.vesselDensity() != null) screening.setVesselDensity(request.vesselDensity());
    return screeningRepository.save(screening);
  }

  @Transactional
  public Screening createScreening(UUID patientId, String imageUrl) {
    Screening screening = new Screening(patientId, imageUrl);

    try {
      Map body = null;
      // 1. Cloud AI Engine (Gemini 3.7 Flash High API)
      if (geminiAiService != null) {
        body = geminiAiService.analyzeRetinalVascular("OD", imageUrl);
      }

      if (body != null) {
        log.info("Processing clinical AI inference findings from Cloud AI Engine: {}", body);

        RiskLevel calculatedRisk;
        Number overallRisk = (Number) body.get("overallVascularRiskScore");
        if (overallRisk == null) {
          overallRisk = (Number) body.get("overallRiskScore");
        }
        if (overallRisk == null) {
          throw new IllegalStateException("AI response is missing overallVascularRiskScore");
        }
        int score = overallRisk.intValue();
        if (score >= 80) calculatedRisk = RiskLevel.CRITICAL;
        else if (score >= 65) calculatedRisk = RiskLevel.HIGH;
        else if (score >= 40) calculatedRisk = RiskLevel.MODERATE;
        else calculatedRisk = RiskLevel.LOW;

        Double confidence = null;
        Number conf = (Number) body.get("confidence");
        if (conf != null) {
          confidence = conf.doubleValue();
        }

        String findings = null;
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

        String xai = (String) body.get("xaiRationale");
        if (xai != null && !xai.isBlank() && (findings == null || findings.contains("Cấu trúc vi mạch"))) {
          findings = xai;
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
        screening.setAiRiskLevel(calculatedRisk);
        screening.setConfidence(confidence != null ? Math.round(confidence * 100.0) / 100.0 : null);
        screening.setFindings(findings);
        // --- FR-5: auto-generate health recommendations/warnings from the computed risk level ---
        screening.setRecommendations(generateRecommendations(calculatedRisk));
        screening.setStatus(ScreeningStatus.ANALYZED);
      } else {
        log.warn("AI service returned non-successful response or empty body");
        screening.setStatus(ScreeningStatus.FAILED);
        screening.setRiskLevel(null);
        screening.setAiRiskLevel(null);
        screening.setConfidence(null);
        screening.setFindings("Dịch vụ AI trả về kết quả không hợp lệ. Ảnh chụp đã được lưu trữ an toàn.");
      }
    } catch (Exception e) {
      log.error("AI service call failed (server offline or inference error): {}", e.getMessage());
      screening.setStatus(ScreeningStatus.FAILED);
      screening.setRiskLevel(null);
      screening.setAiRiskLevel(null);
      screening.setConfidence(null);
      screening.setFindings("Không thể kết nối đến máy chủ phân tích AI. Ảnh chụp võng mạc đã được lưu trữ an toàn để thẩm định lại.");
    }

    Screening saved = screeningRepository.save(screening);
    
    // FR-9: Gửi thông báo SSE và In-App ngay khi AI phân tích xong
    try {
      if (saved.getStatus() == ScreeningStatus.ANALYZED) {
        String severity = saved.getRiskLevel() == RiskLevel.CRITICAL ? "CRITICAL"
            : (saved.getRiskLevel() == RiskLevel.HIGH ? "WARNING" : "SUCCESS");
        userNotificationService.sendNotificationToUser(
            patientId,
            "Kết quả phân tích AI đã sẵn sàng",
            "Ảnh võng mạc của bạn đã được phân tích. Mức độ nguy cơ vi mạch: " + saved.getRiskLevel()
                + (saved.getConfidence() != null ? " (Độ tin cậy: " + saved.getConfidence() + ")" : "") + ".",
            "AI_READY",
            severity,
            "/cds-viewer"
        );
      }
    } catch (Exception e) {
      log.warn("Không thể gửi thông báo AI_READY: {}", e.getMessage());
    }

    return saved;
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForPatient(UUID patientId) {
    return screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForDoctor(UUID doctorId) {
    List<UUID> assignedPatientIds = assignmentRepository.findPatientIdsByDoctorIdAndStatus(
        doctorId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
    if (assignedPatientIds == null || assignedPatientIds.isEmpty()) {
      return List.of();
    }
    return screeningRepository.findByPatientIdInOrderByCreatedAtDesc(assignedPatientIds);
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
  public Screening addDoctorReview(
      UUID screeningId,
      UUID doctorId,
      ReviewDecision decision,
      String doctorNotes,
      RiskLevel adjustedCardioRisk,
      RiskLevel adjustedDrRisk,
      List<String> icd10Codes) {
    Screening screening = getScreeningById(screeningId);
    if (decision == ReviewDecision.MODIFIED && adjustedCardioRisk == null && adjustedDrRisk == null) {
      throw new IllegalArgumentException("Thẩm định MODIFIED phải có ít nhất một mức nguy cơ điều chỉnh");
    }
    if (screening.getOriginalAiRiskLevel() == null) {
      screening.setOriginalAiRiskLevel(screening.getRiskLevel());
    }
    screening.setDoctorId(doctorId);
    screening.setDoctorNotes(doctorNotes);
    screening.setReviewDecision(decision);
    screening.setDoctorCardiovascularRiskLevel(adjustedCardioRisk);
    screening.setDoctorDiabeticRetinopathyRiskLevel(adjustedDrRisk);
    screening.setIcd10Codes(icd10Codes == null ? null : String.join("\n", icd10Codes));
    if (adjustedCardioRisk != null) {
      screening.setDoctorRiskLevel(adjustedCardioRisk);
      screening.setRiskLevel(adjustedCardioRisk);
    } else if (adjustedDrRisk != null) {
      screening.setDoctorRiskLevel(adjustedDrRisk);
      screening.setRiskLevel(adjustedDrRisk);
    }
    screening.setReviewedAt(java.time.Instant.now());
    screening.setStatus(ScreeningStatus.REVIEWED);
    Instant signedAt = Instant.now();
    screening.setSignedAt(signedAt);
    screening.setDigitalSignature(createReviewSignature(
        screening, doctorId, decision, doctorNotes, adjustedCardioRisk, adjustedDrRisk, icd10Codes, signedAt));
    Screening saved = screeningRepository.save(screening);

    // Gửi thông báo cho bệnh nhân khi bác sĩ ký duyệt
    try {
      userNotificationService.sendNotificationToUser(
          saved.getPatientId(),
          "Bác sĩ đã thẩm định kết quả",
          "Bác sĩ chuyên khoa đã ký duyệt báo cáo lâm sàng cho ca khám của bạn. Quyết định: " + decision.name(),
          "DOCTOR_REVIEW",
          "INFO",
          "/scan-history"
      );
    } catch (Exception e) {
      log.warn("Không thể gửi thông báo DOCTOR_REVIEW: {}", e.getMessage());
    }

    return saved;
  }

  private String createReviewSignature(
      Screening screening,
      UUID doctorId,
      ReviewDecision decision,
      String doctorNotes,
      RiskLevel adjustedCardioRisk,
      RiskLevel adjustedDrRisk,
      List<String> icd10Codes,
      Instant signedAt) {
    String payload = String.join("|",
        String.valueOf(screening.getId()),
        doctorId.toString(),
        decision.name(),
        doctorNotes,
        String.valueOf(adjustedCardioRisk),
        String.valueOf(adjustedDrRisk),
        icd10Codes == null ? "" : String.join(",", icd10Codes),
        signedAt.toString());
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(signatureSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return "HMAC-SHA256:" + Base64.getUrlEncoder().withoutPadding()
          .encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    } catch (java.security.GeneralSecurityException exception) {
      throw new IllegalStateException("Không thể tạo chữ ký thẩm định", exception);
    }
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
