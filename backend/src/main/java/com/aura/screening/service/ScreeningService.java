package com.aura.screening.service;

import com.aura.auth.exception.AuthException;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.common.response.ErrorCode;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
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

@Service
public class ScreeningService {

  private static final Logger log = LoggerFactory.getLogger(ScreeningService.class);

  private final ScreeningRepository screeningRepository;
  private final com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository;
  private final com.aura.notification.service.UserNotificationService userNotificationService;
  private final com.aura.audit.service.AuditLogService auditLogService;
  private final com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository;
  private final com.aura.user.repository.UserRepository userRepository;
  private final GeminiRetinalAiService geminiAiService;
  private final com.aura.billing.service.BillingService billingService;
  private final com.aura.patient.repository.PatientProfileRepository patientProfileRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Value("${aura.signature.secret:AURA_REVIEW_SIGNATURE_SECRET_2026}")
  private String signatureSecret = "AURA_REVIEW_SIGNATURE_SECRET_2026";

  @org.springframework.beans.factory.annotation.Autowired
  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      com.aura.audit.service.AuditLogService auditLogService,
      com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository,
      com.aura.user.repository.UserRepository userRepository,
      GeminiRetinalAiService geminiAiService,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.billing.service.BillingService billingService,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.patient.repository.PatientProfileRepository patientProfileRepository) {
    this.screeningRepository = screeningRepository;
    this.assignmentRepository = assignmentRepository;
    this.userNotificationService = userNotificationService;
    this.auditLogService = auditLogService;
    this.clinicMemberRepository = clinicMemberRepository;
    this.userRepository = userRepository;
    this.geminiAiService = geminiAiService;
    this.billingService = billingService;
    this.patientProfileRepository = patientProfileRepository;
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      com.aura.audit.service.AuditLogService auditLogService,
      com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository,
      com.aura.user.repository.UserRepository userRepository,
      GeminiRetinalAiService geminiAiService,
      com.aura.billing.service.BillingService billingService) {
    this(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository, userRepository, geminiAiService, billingService, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      com.aura.audit.service.AuditLogService auditLogService,
      com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository,
      com.aura.user.repository.UserRepository userRepository,
      GeminiRetinalAiService geminiAiService) {
    this(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository, userRepository, geminiAiService, null, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      GeminiRetinalAiService geminiAiService) {
    this(screeningRepository, assignmentRepository, userNotificationService, null, null, null, geminiAiService, null, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      GeminiRetinalAiService geminiAiService,
      Object ignoredRestClient) {
    this(screeningRepository, assignmentRepository, userNotificationService, null, null, null, geminiAiService, null, null);
  }

  public Screening createScreening(UUID patientId, com.aura.screening.dto.CreateScreeningRequest request) {
    String eye = request.eyePosition() != null && !request.eyePosition().isBlank() ? request.eyePosition() : "OD";
    String scanType = request.scanType() != null && !request.scanType().isBlank() ? request.scanType() : "Fundus";
    Screening screening = new Screening(patientId, request.imageUrl());
    screening.setEyePosition(eye);
    screening.setScanType(scanType);
    screening.setDetectedAnomalies("[]");
    if (request.fileName() != null) screening.setFileName(request.fileName());
    if (request.fileSize() != null) screening.setFileSize(request.fileSize());
    if (request.mimeType() != null) screening.setMimeType(request.mimeType());
    if (request.avRatio() != null) screening.setAvRatio(request.avRatio());
    if (request.vesselDensity() != null) screening.setVesselDensity(request.vesselDensity());

    // Gán clinicId từ request
    if (request.clinicId() != null) {
      screening.setClinicId(request.clinicId());
    }

    // FR-11, FR-12: Kiểm tra hạn mức và trừ lượt khám đối với bệnh nhân cá nhân tự thực hiện sàng lọc
    if (!isCallerClinicalStaff() && billingService != null && request.clinicId() == null) {
      boolean deducted = billingService.deductCredit(patientId);
      if (!deducted) {
        int remaining = billingService.getRemainingCredits(patientId);
        if (remaining <= 0) {
          throw new com.aura.billing.exception.PaymentFailedException(
              "Tài khoản của bạn đã hết lượt khám sàng lọc AI. Vui lòng nạp thêm gói dịch vụ bằng cách quét mã QR chuyển khoản để tiếp tục.");
        }
      }
    }

    // Tự động tìm bác sĩ phụ trách từ doctor_patient_assignments (nếu ca khám chưa gán bác sĩ)
    resolveAndAssignDoctorAndClinic(screening, patientId);

    // Gọi AI ngoại vi ngoài transaction để không block Connection Pool của database
    executeAiAnalysisAndPopulate(screening, eye, request.imageUrl());

    Screening saved = saveScreeningRecord(screening);
    sendAiReadyNotification(saved, patientId);
    logScreeningCreationAudit(saved, patientId);
    return saved;
  }

  public Screening createScreening(UUID patientId, String imageUrl) {
    Screening screening = new Screening(patientId, imageUrl);
    screening.setEyePosition("OD");
    screening.setScanType("Fundus");
    screening.setDetectedAnomalies("[]");

    if (!isCallerClinicalStaff() && billingService != null && screening.getClinicId() == null) {
      boolean deducted = billingService.deductCredit(patientId);
      if (!deducted) {
        int remaining = billingService.getRemainingCredits(patientId);
        if (remaining <= 0) {
          throw new com.aura.billing.exception.PaymentFailedException(
              "Tài khoản của bạn đã hết lượt khám sàng lọc AI. Vui lòng nạp thêm gói dịch vụ bằng cách quét mã QR chuyển khoản để tiếp tục.");
        }
      }
    }

    resolveAndAssignDoctorAndClinic(screening, patientId);

    // Gọi AI ngoại vi ngoài transaction để không block Connection Pool của database
    executeAiAnalysisAndPopulate(screening, "OD", imageUrl);

    Screening saved = saveScreeningRecord(screening);
    sendAiReadyNotification(saved, patientId);
    logScreeningCreationAudit(saved, patientId);
    return saved;
  }

  private boolean isCallerClinicalStaff() {
    try {
      var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
      if (auth != null && auth.getPrincipal() instanceof com.aura.auth.security.AuraUserPrincipal principal) {
        if (principal.roles() != null) {
          return principal.roles().stream().anyMatch(r -> {
            String up = r.toUpperCase();
            return up.contains("DOCTOR") || up.contains("ADMIN") || up.contains("CLINIC");
          });
        }
      }
    } catch (Exception ignored) {}
    return false;
  }

  private void resolveAndAssignDoctorAndClinic(Screening screening, UUID patientId) {
    try {
      if (screening.getDoctorId() == null && assignmentRepository != null) {
        var activeAssignments = assignmentRepository.findByPatientIdAndStatus(
            patientId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
        if (activeAssignments != null && !activeAssignments.isEmpty()) {
          var firstAssignment = activeAssignments.get(0);
          if (firstAssignment.getDoctor() != null) {
            screening.setDoctorId(firstAssignment.getDoctor().getId());
          }
        }
      }

      if (screening.getClinicId() == null && screening.getDoctorId() != null && clinicMemberRepository != null) {
        var clinicMembers = clinicMemberRepository.findByDoctorId(screening.getDoctorId());
        if (clinicMembers != null && !clinicMembers.isEmpty()) {
          var firstMember = clinicMembers.get(0);
          if (firstMember.getClinic() != null) {
            screening.setClinicId(firstMember.getClinic().getId());
          }
        }
      }
    } catch (Exception e) {
      log.warn("Không thể tự động gán bác sĩ/phòng khám cho ca sàng lọc: {}", e.getMessage());
    }
  }

  private void logScreeningCreationAudit(Screening saved, UUID patientId) {
    try {
      if (auditLogService != null) {
        String email = null;
        if (userRepository != null) {
          email = userRepository.findById(patientId).map(com.aura.user.entity.User::getEmail).orElse(null);
        }
        auditLogService.logEvent(
            patientId,
            email,
            "USER",
            "SCREENING",
            "SCREENING_CREATE",
            "SCREENING",
            saved.getId() != null ? saved.getId().toString() : null,
            null,
            null,
            "SUCCESS",
            "Tạo phiên sàng lọc võng mạc và thực thi phân tích AI thành công"
        );
      }
    } catch (Exception e) {
      log.warn("Không thể ghi audit log SCREENING_CREATE: {}", e.getMessage());
    }
  }

  @Transactional
  public Screening saveScreeningRecord(Screening screening) {
    return screeningRepository.save(screening);
  }

  private void executeAiAnalysisAndPopulate(Screening screening, String eye, String imageUrl) {
    try {
      Map body = null;
      // 1. Cloud AI Engine (Gemini 3.7 Flash High API)
      if (geminiAiService != null) {
        body = geminiAiService.analyzeRetinalVascular(eye, imageUrl);
      }

      if (body != null) {
        log.info("Processing clinical AI inference findings from Cloud AI Engine: {}", body);

        RiskLevel calculatedRisk;
        Number overallRisk = (Number) body.get("overallVascularRiskScore");
        if (overallRisk == null) {
          overallRisk = (Number) body.get("overallRiskScore");
        }
        if (overallRisk == null) {
          overallRisk = (Number) body.get("riskScore");
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
        List<String> combinedNotes = new ArrayList<>();
        // --- FR-3: parse per-category risk breakdown from the AI Core's `predictions` array ---
        List<Map> predictions = (List<Map>) body.get("predictions");
        if (predictions != null) {
          for (Map prediction : predictions) {
            String category = String.valueOf(prediction.get("category"));
            String predRiskLevel = String.valueOf(prediction.get("riskLevel"));
            String clinicalNote = (String) prediction.get("clinicalNote");

            // ĐÚNG CHUẨN Y KHOA: Lấy riskScore của bệnh lý đó (0-100),
            // TUYỆT ĐỐI KHÔNG LẤY confidence * 100 vì confidence là độ tự tin thống kê!
            Number predScoreNum = (Number) prediction.get("riskScore");
            if (predScoreNum == null) {
              predScoreNum = (Number) prediction.get("score");
            }
            int predScore;
            if (predScoreNum != null) {
              predScore = predScoreNum.intValue();
            } else {
              // Suy ra điểm số phù hợp với mức rủi ro
              if ("CRITICAL".equalsIgnoreCase(predRiskLevel) || "SEVERE".equalsIgnoreCase(predRiskLevel)) {
                predScore = Math.max(score, 85);
              } else if ("HIGH".equalsIgnoreCase(predRiskLevel)) {
                predScore = Math.max(score, 70);
              } else if ("MODERATE".equalsIgnoreCase(predRiskLevel) || "MEDIUM".equalsIgnoreCase(predRiskLevel)) {
                predScore = 48;
              } else {
                predScore = 18;
              }
            }

            if (category.contains("Cardiovascular") || category.contains("Hypertensive")) {
              screening.setCardiovascularRiskScore(predScore);
              screening.setCardiovascularRiskLevel(predRiskLevel);
              screening.setStrokeRiskScore(predScore);
              screening.setStrokeRiskLevel(predRiskLevel);
              screening.setHypertensionRiskScore(predScore);
              screening.setHypertensionRiskLevel(predRiskLevel);
              if (clinicalNote != null && !clinicalNote.isBlank()) {
                combinedNotes.add("• Tim mạch & Huyết áp: " + clinicalNote);
              }
            } else if (category.contains("Diabetic Retinopathy")) {
              screening.setDiabeticRetinopathyRiskScore(predScore);
              screening.setDiabeticRetinopathyRiskLevel(predRiskLevel);

              String etdrs = (String) prediction.get("etdrsGrade");
              if (etdrs == null || etdrs.isBlank()) {
                if (predScore >= 80 || "CRITICAL".equalsIgnoreCase(predRiskLevel)) {
                  etdrs = "Cấp độ 4 (PDR - Tăng sinh)";
                } else if (predScore >= 65 || "HIGH".equalsIgnoreCase(predRiskLevel)) {
                  etdrs = "Cấp độ 3 (NPDR nặng - Tiền tăng sinh)";
                } else if (predScore >= 45 || "MODERATE".equalsIgnoreCase(predRiskLevel)) {
                  etdrs = "Cấp độ 2 (NPDR trung bình)";
                } else if (predScore >= 25) {
                  etdrs = "Cấp độ 1 (NPDR nhẹ)";
                } else {
                  etdrs = "Cấp độ 0 (Không DR)";
                }
              }
              screening.setEtdrsGrade(etdrs);
              if (clinicalNote != null && !clinicalNote.isBlank()) {
                combinedNotes.add("• Võng mạc ĐTĐ (" + etdrs + "): " + clinicalNote);
              }
            }
          }
        }

        if (!combinedNotes.isEmpty()) {
          findings = String.join("\n", combinedNotes);
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

        // --- Retinal vascular anomalies localization (detectedAnomalies) ---
        Object anomaliesObj = body.get("detectedAnomalies");
        if (anomaliesObj != null) {
          try {
            if (anomaliesObj instanceof String anomaliesStr) {
              String trimmed = anomaliesStr.trim();
              if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                screening.setDetectedAnomalies(trimmed);
              } else {
                screening.setDetectedAnomalies("[]");
              }
            } else if (anomaliesObj instanceof List<?> list) {
              screening.setDetectedAnomalies(objectMapper.writeValueAsString(list));
            } else {
              screening.setDetectedAnomalies(objectMapper.writeValueAsString(anomaliesObj));
            }
          } catch (Exception ex) {
            log.warn("Không thể serialize detectedAnomalies: {}", ex.getMessage());
            screening.setDetectedAnomalies("[]");
          }
        } else {
          screening.setDetectedAnomalies("[]");
        }

        // --- Retinal vessel segmentation mask (vesselMaskUrl / vesselMaskBase64) ---
        Object maskObj = body.get("vesselMaskUrl");
        if (maskObj == null) {
          maskObj = body.get("vesselMaskBase64");
        }
        if (maskObj != null) {
          String maskStr = maskObj.toString().trim();
          if (!maskStr.isBlank()) {
            screening.setVesselMaskUrl(maskStr);
          }
        }

        screening.setRiskScore(score);
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
        screening.setRiskScore(null);
        screening.setConfidence(null);
        screening.setDetectedAnomalies("[]");
        screening.setFindings("Dịch vụ AI trả về kết quả không hợp lệ. Ảnh chụp đã được lưu trữ an toàn.");
      }
    } catch (Exception e) {
      log.error("AI service call failed (server offline or inference error): {}", e.getMessage());
      screening.setStatus(ScreeningStatus.FAILED);
      screening.setRiskLevel(null);
      screening.setAiRiskLevel(null);
      screening.setRiskScore(null);
      screening.setConfidence(null);
      screening.setDetectedAnomalies("[]");
      screening.setFindings("Không thể kết nối đến máy chủ phân tích AI. Ảnh chụp võng mạc đã được lưu trữ an toàn để thẩm định lại.");
    }
  }

  private void sendAiReadyNotification(Screening saved, UUID patientId) {
    try {
      if (saved.getStatus() == ScreeningStatus.ANALYZED) {
        userNotificationService.sendNotificationToUser(
            patientId,
            "Ảnh võng mạc đã hoàn tất phân tích sơ bộ",
            "Ảnh võng mạc của bạn đã được phân tích sơ bộ bởi AI và đang được chuyển đến bác sĩ chuyên khoa thẩm định lâm sàng.",
            "AI_READY",
            "INFO",
            "/cds-viewer"
        );
      }
    } catch (Exception e) {
      log.warn("Không thể gửi thông báo AI_READY: {}", e.getMessage());
    }
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
        doctorNotes != null ? doctorNotes : "",
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

  public boolean isUserScreeningOwner(Screening screening, UUID userId) {
    if (screening == null || userId == null) {
      return false;
    }
    if (screening.getPatientId() != null) {
      if (screening.getPatientId().equals(userId)) {
        return true;
      }
      if (patientProfileRepository != null) {
        var profileByUserId = patientProfileRepository.findByUserId(userId);
        if (profileByUserId.isPresent() && profileByUserId.get().getId().equals(screening.getPatientId())) {
          return true;
        }
        var profileById = patientProfileRepository.findById(screening.getPatientId());
        if (profileById.isPresent() && userId.equals(profileById.get().getUserId())) {
          return true;
        }
      }
    } else {
      // Cho phép xóa nếu patientId là null (ca khám chưa gán hoặc phát sinh trong phiên người dùng)
      return true;
    }
    return false;
  }

  public boolean isDoctorAssignedToScreening(Screening screening, UUID userId) {
    if (screening == null || userId == null) {
      return false;
    }
    if (screening.getDoctorId() != null && screening.getDoctorId().equals(userId)) {
      return true;
    }
    if (assignmentRepository != null && screening.getPatientId() != null) {
      if (assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
          userId, screening.getPatientId(), com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
        return true;
      }
      if (patientProfileRepository != null) {
        var profile = patientProfileRepository.findById(screening.getPatientId());
        if (profile.isPresent() && profile.get().getUserId() != null) {
          if (assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
              userId, profile.get().getUserId(), com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  @Transactional
  public void deleteScreening(UUID screeningId, UUID userId, boolean isAdmin) {
    Screening screening = getScreeningById(screeningId);
    boolean isOwner = isUserScreeningOwner(screening, userId);
    boolean isDoctorAssigned = isDoctorAssignedToScreening(screening, userId);
    boolean isClinicMember = false;
    if (screening.getClinicId() != null && clinicMemberRepository != null && userId != null) {
      isClinicMember = clinicMemberRepository.findByDoctorId(userId).stream()
          .anyMatch(m -> m.getClinic() != null && m.getClinic().getId().equals(screening.getClinicId()));
    }

    if (!isAdmin && !isOwner && !isDoctorAssigned && !isClinicMember) {
      throw new AuthException(
          ErrorCode.ACCESS_DENIED,
          "Bạn không có quyền xóa ca sàng lọc này");
    }
    screeningRepository.delete(screening);
    log.info("Đã xóa ca sàng lọc {} bởi người dùng {} (isAdmin={}, isOwner={}, isDoctorAssigned={})", screeningId, userId, isAdmin, isOwner, isDoctorAssigned);
  }

  @Transactional
  public int batchDeleteScreenings(List<String> screeningIds, UUID userId, boolean isAdmin) {
    if (screeningIds == null || screeningIds.isEmpty()) {
      return 0;
    }
    List<UUID> validUuids = new ArrayList<>();
    for (String idStr : screeningIds) {
      if (idStr != null && !idStr.isBlank()) {
        try {
          validUuids.add(UUID.fromString(idStr.trim()));
        } catch (IllegalArgumentException e) {
          log.warn("Bỏ qua ID không đúng định dạng UUID khi xóa hàng loạt: {}", idStr);
        }
      }
    }
    if (validUuids.isEmpty()) {
      return 0;
    }
    List<Screening> toDelete = new ArrayList<>();
    for (UUID id : validUuids) {
      screeningRepository.findById(id).ifPresent(screening -> {
        boolean isOwner = isUserScreeningOwner(screening, userId);
        boolean isDoctorAssigned = isDoctorAssignedToScreening(screening, userId);
        boolean isClinicMember = false;
        if (screening.getClinicId() != null && clinicMemberRepository != null && userId != null) {
          isClinicMember = clinicMemberRepository.findByDoctorId(userId).stream()
              .anyMatch(m -> m.getClinic() != null && m.getClinic().getId().equals(screening.getClinicId()));
        }

        if (isAdmin || isOwner || isDoctorAssigned || isClinicMember) {
          toDelete.add(screening);
        }
      });
    }
    if (!toDelete.isEmpty()) {
      screeningRepository.deleteAll(toDelete);
      log.info("Đã xóa hàng loạt {} ca sàng lọc bởi người dùng {} (isAdmin={})", toDelete.size(), userId, isAdmin);
    }
    return toDelete.size();
  }
}
