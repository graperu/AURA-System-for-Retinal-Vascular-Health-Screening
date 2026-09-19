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
import com.aura.realtime.RealtimeEventPublisher;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
  private final com.aura.patient.repository.PatientMedicalProfileRepository patientMedicalProfileRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @org.springframework.beans.factory.annotation.Autowired(required = false)
  private SimpMessagingTemplate messagingTemplate;

  @org.springframework.beans.factory.annotation.Autowired(required = false)
  private RealtimeEventPublisher realtimeEventPublisher;

  @org.springframework.beans.factory.annotation.Autowired(required = false)
  private com.aura.system.service.SystemConfigService systemConfigService;

  public void setMessagingTemplate(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public void setRealtimeEventPublisher(RealtimeEventPublisher realtimeEventPublisher) {
    this.realtimeEventPublisher = realtimeEventPublisher;
  }

  public void setSystemConfigService(com.aura.system.service.SystemConfigService systemConfigService) {
    this.systemConfigService = systemConfigService;
  }

  private RealtimeEventPublisher getPublisher() {
    if (this.realtimeEventPublisher != null) {
      return this.realtimeEventPublisher;
    }
    if (this.messagingTemplate != null) {
      this.realtimeEventPublisher = new RealtimeEventPublisher(this.messagingTemplate);
      return this.realtimeEventPublisher;
    }
    return null;
  }

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
      @org.springframework.beans.factory.annotation.Autowired(required = false) com.aura.billing.service.BillingService billingService,
      @org.springframework.beans.factory.annotation.Autowired(required = false) com.aura.patient.repository.PatientProfileRepository patientProfileRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false) com.aura.patient.repository.PatientMedicalProfileRepository patientMedicalProfileRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false) com.aura.system.service.SystemConfigService systemConfigService) {
    this.screeningRepository = screeningRepository;
    this.assignmentRepository = assignmentRepository;
    this.userNotificationService = userNotificationService;
    this.auditLogService = auditLogService;
    this.clinicMemberRepository = clinicMemberRepository;
    this.userRepository = userRepository;
    this.geminiAiService = geminiAiService;
    this.billingService = billingService;
    this.patientProfileRepository = patientProfileRepository;
    this.patientMedicalProfileRepository = patientMedicalProfileRepository;
    this.systemConfigService = systemConfigService;
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      com.aura.audit.service.AuditLogService auditLogService,
      com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository,
      com.aura.user.repository.UserRepository userRepository,
      GeminiRetinalAiService geminiAiService,
      com.aura.billing.service.BillingService billingService,
      com.aura.patient.repository.PatientProfileRepository patientProfileRepository,
      com.aura.patient.repository.PatientMedicalProfileRepository patientMedicalProfileRepository) {
    this(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository,
        userRepository, geminiAiService, billingService, patientProfileRepository, patientMedicalProfileRepository, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      com.aura.audit.service.AuditLogService auditLogService,
      com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository,
      com.aura.user.repository.UserRepository userRepository,
      GeminiRetinalAiService geminiAiService,
      com.aura.billing.service.BillingService billingService,
      com.aura.patient.repository.PatientProfileRepository patientProfileRepository) {
    this(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository,
        userRepository, geminiAiService, billingService, patientProfileRepository, null);
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
    this(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository,
        userRepository, geminiAiService, billingService, null, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      com.aura.audit.service.AuditLogService auditLogService,
      com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository,
      com.aura.user.repository.UserRepository userRepository,
      GeminiRetinalAiService geminiAiService) {
    this(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository,
        userRepository, geminiAiService, null, null, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      GeminiRetinalAiService geminiAiService) {
    this(screeningRepository, assignmentRepository, userNotificationService, null, null, null, geminiAiService, null,
        null, null);
  }

  public ScreeningService(
      ScreeningRepository screeningRepository,
      com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
      com.aura.notification.service.UserNotificationService userNotificationService,
      GeminiRetinalAiService geminiAiService,
      Object ignoredRestClient) {
    this(screeningRepository, assignmentRepository, userNotificationService, null, null, null, geminiAiService, null,
        null, null);
  }

  public Screening createScreening(UUID patientId, com.aura.screening.dto.CreateScreeningRequest request) {
    return createScreening(patientId, request, null);
  }

  public Screening createScreening(UUID patientId, com.aura.screening.dto.CreateScreeningRequest request, UUID doctorId) {
    String eye = request.eyePosition() != null && !request.eyePosition().isBlank() ? request.eyePosition() : "OD";
    String scanType = request.scanType() != null && !request.scanType().isBlank() ? request.scanType() : "Fundus";
    Screening screening = new Screening(patientId, request.imageUrl());
    screening.setEyePosition(eye);
    screening.setScanType(scanType);
    screening.setDetectedAnomalies("[]");
    if (request.fileName() != null)
      screening.setFileName(request.fileName());
    if (request.fileSize() != null)
      screening.setFileSize(request.fileSize());
    if (request.mimeType() != null)
      screening.setMimeType(request.mimeType());
    if (request.avRatio() != null)
      screening.setAvRatio(request.avRatio());
    if (request.vesselDensity() != null)
      screening.setVesselDensity(request.vesselDensity());

    // Gán clinicId từ request hoặc xác định từ tài khoản phòng khám đăng nhập
    UUID effectiveClinicId = request.clinicId();
    com.aura.auth.security.AuraUserPrincipal principal = getCallerPrincipal();
    boolean callerIsClinic = isCallerClinic();
    if (effectiveClinicId == null && callerIsClinic && principal != null) {
      effectiveClinicId = principal.id();
      screening.setClinicId(effectiveClinicId);
    } else if (effectiveClinicId != null) {
      screening.setClinicId(effectiveClinicId);
    }

    if (doctorId != null) {
      screening.setDoctorId(doctorId);
    }

    // FR-11, FR-12 & R1: Kiểm tra hạn mức và trừ lượt khám (Phòng khám hoặc Bệnh nhân)
    boolean patientCreditDeducted = false;
    boolean clinicCreditDeducted = false;

    if (billingService != null) {
      if (effectiveClinicId != null && (callerIsClinic || request.clinicId() != null)) {
        // R1: Trừ lượt khám của phòng khám
        int remaining = billingService.getRemainingCredits(effectiveClinicId);
        if (remaining < 1) {
          throw new com.aura.billing.exception.PaymentFailedException(
              String.format("Cơ sở y tế không đủ lượt quét khả dụng (Hiện có %d). Vui lòng nạp thêm gói lượt khám.", remaining));
        }
        boolean deducted = billingService.deductCredits(effectiveClinicId, 1);
        if (!deducted) {
          throw new com.aura.billing.exception.PaymentFailedException(
              "Cơ sở y tế không đủ lượt quét khả dụng. Vui lòng nạp thêm gói dịch vụ để tiếp tục.");
        }
        clinicCreditDeducted = true;
      } else if (!isCallerClinicalStaff() && request.clinicId() == null) {
        // Trừ lượt khám của bệnh nhân cá nhân
        boolean deducted = billingService.deductCredit(patientId);
        if (!deducted) {
          int remaining = billingService.getRemainingCredits(patientId);
          if (remaining <= 0) {
            throw new com.aura.billing.exception.PaymentFailedException(
                "Tài khoản của bạn đã hết lượt khám sàng lọc AI. Vui lòng nạp thêm gói dịch vụ bằng cách quét mã QR chuyển khoản để tiếp tục.");
          }
        } else {
          patientCreditDeducted = true;
        }
      }
    }

    // Tự động tìm bác sĩ phụ trách từ doctor_patient_assignments (nếu ca khám chưa
    // gán bác sĩ)
    resolveAndAssignDoctorAndClinic(screening, patientId);

    // BE-CONS-3: Lưu trạng thái PENDING ban đầu để gán non-null UUID trước khi phát sự kiện STOMP
    screening.setStatus(ScreeningStatus.PENDING);
    screening = saveScreeningRecord(screening);

    var pub1 = getPublisher();
    if (pub1 != null) {
      pub1.publishScreeningCreated(screening);
      pub1.publishScreeningProcessing(
          patientId,
          screening.getId(),
          "IMAGE_UPLOADED",
          1,
          5,
          "Tải ảnh thành công",
          "Đã tải ảnh võng mạc lên hệ thống và kiểm tra định dạng"
      );
    }

    // Gọi AI ngoại vi ngoài transaction để không block Connection Pool của database
    executeAiAnalysisAndPopulate(screening, eye, request.imageUrl());

    // BE-BILL-4 & R1: Tự động hoàn trả lượt khám nếu AI phân tích thất bại
    if (screening.getStatus() == ScreeningStatus.FAILED && billingService != null) {
      if (clinicCreditDeducted && effectiveClinicId != null) {
        billingService.refundCredit(effectiveClinicId, 1);
      } else if (patientCreditDeducted) {
        billingService.refundCredit(patientId, 1);
      }
    }

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

    // Gán clinicId từ tài khoản phòng khám đăng nhập nếu có
    UUID effectiveClinicId = screening.getClinicId();
    com.aura.auth.security.AuraUserPrincipal principal = getCallerPrincipal();
    boolean callerIsClinic = isCallerClinic();
    if (effectiveClinicId == null && callerIsClinic && principal != null) {
      effectiveClinicId = principal.id();
      screening.setClinicId(effectiveClinicId);
    }

    boolean patientCreditDeducted = false;
    boolean clinicCreditDeducted = false;

    if (billingService != null) {
      if (effectiveClinicId != null && callerIsClinic) {
        int remaining = billingService.getRemainingCredits(effectiveClinicId);
        if (remaining < 1) {
          throw new com.aura.billing.exception.PaymentFailedException(
              String.format("Cơ sở y tế không đủ lượt quét khả dụng (Hiện có %d). Vui lòng nạp thêm gói lượt khám.", remaining));
        }
        boolean deducted = billingService.deductCredits(effectiveClinicId, 1);
        if (!deducted) {
          throw new com.aura.billing.exception.PaymentFailedException(
              "Cơ sở y tế không đủ lượt quét khả dụng. Vui lòng nạp thêm gói dịch vụ để tiếp tục.");
        }
        clinicCreditDeducted = true;
      } else if (!isCallerClinicalStaff() && screening.getClinicId() == null) {
        boolean deducted = billingService.deductCredit(patientId);
        if (!deducted) {
          int remaining = billingService.getRemainingCredits(patientId);
          if (remaining <= 0) {
            throw new com.aura.billing.exception.PaymentFailedException(
                "Tài khoản của bạn đã hết lượt khám sàng lọc AI. Vui lòng nạp thêm gói dịch vụ bằng cách quét mã QR chuyển khoản để tiếp tục.");
          }
        } else {
          patientCreditDeducted = true;
        }
      }
    }

    resolveAndAssignDoctorAndClinic(screening, patientId);

    // BE-CONS-3: Lưu trạng thái PENDING ban đầu để gán non-null UUID trước khi phát sự kiện STOMP
    screening.setStatus(ScreeningStatus.PENDING);
    screening = saveScreeningRecord(screening);

    var pub2 = getPublisher();
    if (pub2 != null) {
      pub2.publishScreeningCreated(screening);
      pub2.publishScreeningProcessing(
          patientId,
          screening.getId(),
          "IMAGE_UPLOADED",
          1,
          5,
          "Tải ảnh thành công",
          "Đã tải ảnh võng mạc lên hệ thống và kiểm tra định dạng"
      );
    }

    // Gọi AI ngoại vi ngoài transaction để không block Connection Pool của database
    executeAiAnalysisAndPopulate(screening, "OD", imageUrl);

    // BE-BILL-4 & R1: Tự động hoàn trả lượt khám nếu AI phân tích thất bại
    if (screening.getStatus() == ScreeningStatus.FAILED && billingService != null) {
      if (clinicCreditDeducted && effectiveClinicId != null) {
        billingService.refundCredit(effectiveClinicId, 1);
      } else if (patientCreditDeducted) {
        billingService.refundCredit(patientId, 1);
      }
    }

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
    } catch (Exception ignored) {
    }
    return false;
  }

  private boolean isCallerClinic() {
    try {
      var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
      if (auth != null && auth.getPrincipal() instanceof com.aura.auth.security.AuraUserPrincipal principal) {
        if (principal.roles() != null) {
          return principal.roles().stream().anyMatch(r -> r.toUpperCase().contains("CLINIC"));
        }
      }
    } catch (Exception ignored) {
    }
    return false;
  }

  private com.aura.auth.security.AuraUserPrincipal getCallerPrincipal() {
    try {
      var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
      if (auth != null && auth.getPrincipal() instanceof com.aura.auth.security.AuraUserPrincipal principal) {
        return principal;
      }
    } catch (Exception ignored) {
    }
    return null;
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
            "Tạo phiên sàng lọc võng mạc và thực thi phân tích AI thành công");
      }
    } catch (Exception e) {
      log.warn("Không thể ghi audit log SCREENING_CREATE: {}", e.getMessage());
    }
  }

  @Transactional
  public Screening saveScreeningRecord(Screening screening) {
    Screening saved = screeningRepository.save(screening);
    if (saved != null && saved.getId() == null) {
      saved.setId(UUID.randomUUID());
    }
    return saved;
  }

  private void executeAiAnalysisAndPopulate(Screening screening, String eye, String imageUrl) {
    try {
      var pub = getPublisher();
      if (pub != null) {
        pub.publishScreeningProcessing(
            screening.getPatientId(),
            screening.getId(),
            "PREPARING_ANALYSIS",
            2,
            5,
            "Khởi tạo phân tích",
            "Khởi tạo mã hóa bảo mật & tiền xử lý ảnh võng mạc..."
        );
        pub.publishScreeningProcessing(
            screening.getPatientId(),
            screening.getId(),
            "GEMINI_INFERENCE",
            3,
            5,
            "AURA AI Core",
            "Hệ thống AURA AI đang phân tích vi mạch..."
        );
      }
      Map body = null;
      // 1. Cloud AI Engine (Gemini 3.8 Flash High API)
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
        int criticalLimit = systemConfigService != null ? systemConfigService.getCriticalThreshold() : 80;
        int highLimit = systemConfigService != null ? systemConfigService.getHighThreshold() : 65;
        int modLimit = systemConfigService != null ? systemConfigService.getModerateThreshold() : 40;
        String modelVer = systemConfigService != null ? systemConfigService.getActiveModelVersion() : "Gemini 3.8 Flash High / AURA-Core v2.4";

        if (score >= criticalLimit)
          calculatedRisk = RiskLevel.CRITICAL;
        else if (score >= highLimit)
          calculatedRisk = RiskLevel.HIGH;
        else if (score >= modLimit)
          calculatedRisk = RiskLevel.MODERATE;
        else
          calculatedRisk = RiskLevel.LOW;

        screening.setAiModelVersion(modelVer);
        screening.setAppliedThresholds(String.format("CRIT:%d,HIGH:%d,MOD:%d", criticalLimit, highLimit, modLimit));

        Double confidence = null;
        Number conf = (Number) body.get("confidence");
        if (conf != null) {
          confidence = conf.doubleValue();
        }

        String findings = null;
        List<String> combinedNotes = new ArrayList<>();
        // --- FR-3: parse per-category risk breakdown from the AI Core's `predictions`
        // array ---
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

            // --- MED-06 FIX: Tách biệt trục bệnh lý Đột quỵ khỏi Tim mạch ---
            if (category.contains("Stroke") || category.contains("Cerebrovascular") || category.contains("Đột quỵ")) {
              screening.setStrokeRiskScore(predScore);
              screening.setStrokeRiskLevel(predRiskLevel);
              if (clinicalNote != null && !clinicalNote.isBlank()) {
                combinedNotes.add("• Nguy cơ Đột quỵ (3 năm): " + clinicalNote);
              }
            } else if (category.contains("Cardiovascular") || category.contains("Hypertensive")) {
              screening.setCardiovascularRiskScore(predScore);
              screening.setCardiovascularRiskLevel(predRiskLevel);
              screening.setHypertensionRiskScore(predScore);
              screening.setHypertensionRiskLevel(predRiskLevel);
              if (clinicalNote != null && !clinicalNote.isBlank()) {
                combinedNotes.add("• Tim mạch & Huyết áp: " + clinicalNote);
              }
            } else if (category.contains("Diabetic Retinopathy")) {
              screening.setDiabeticRetinopathyRiskScore(predScore);
              screening.setDiabeticRetinopathyRiskLevel(predRiskLevel);

              // --- MED-03 FIX: ETDRS Classification via AAO/ETDRS Rule 4-2-1 ---
              String etdrs = (String) prediction.get("etdrsGrade");
              if (etdrs == null || etdrs.isBlank() || etdrs.toLowerCase().contains("theo phân tích")) {
                String anomaliesRaw = null;
                Object aObj = body.get("detectedAnomalies");
                if (aObj instanceof String s) {
                  anomaliesRaw = s;
                } else if (aObj != null) {
                  try {
                    anomaliesRaw = objectMapper.writeValueAsString(aObj);
                  } catch (Exception ignored) {
                  }
                }
                etdrs = determineEtdrsGradeFromLesions(anomaliesRaw, predScore, predRiskLevel);
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

        // --- Retinal anatomical landmarks & vascular anomalies localization (detectedAnomalies) ---
        Object landmarksObj = body.get("anatomicalLandmarks");
        Object anomaliesObj = body.get("detectedAnomalies");
        List<Map<String, Object>> anomalyList = new ArrayList<>();
        if (anomaliesObj != null) {
          try {
            if (anomaliesObj instanceof List<?> list) {
              for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                  anomalyList.add(new HashMap<>((Map<String, Object>) m));
                }
              }
            } else if (anomaliesObj instanceof String s && s.trim().startsWith("[")) {
              List<Map<String, Object>> parsed = objectMapper.readValue(s, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
              if (parsed != null) anomalyList.addAll(parsed);
            }
          } catch (Exception ex) {
            log.warn("Không thể parse detectedAnomalies: {}", ex.getMessage());
          }
        }

        // Bổ sung các mốc giải phẫu học định vị từ AI (LANDMARK-DISC, LANDMARK-FAZ)
        if (landmarksObj instanceof Map<?, ?> landmarksMap) {
          Object disc = landmarksMap.get("opticDisc");
          if (disc instanceof Map<?, ?> discMap) {
            Number dx = (Number) discMap.get("x");
            Number dy = (Number) discMap.get("y");
            if (dx != null && dy != null) {
              Map<String, Object> discEntry = new HashMap<>();
              discEntry.put("id", "LANDMARK-DISC");
              discEntry.put("type", "Optic_Disc");
              discEntry.put("coordinates", Map.of("x", dx.doubleValue(), "y", dy.doubleValue(), "width", 56, "height", 56));
              discEntry.put("confidence", 0.98);
              discEntry.put("description", "Đĩa thần kinh thị giác (Gai thị)");
              anomalyList.add(discEntry);
            }
          }
          Object fovea = landmarksMap.get("fovea");
          if (fovea instanceof Map<?, ?> foveaMap) {
            Number fx = (Number) foveaMap.get("x");
            Number fy = (Number) foveaMap.get("y");
            if (fx != null && fy != null) {
              Map<String, Object> foveaEntry = new HashMap<>();
              foveaEntry.put("id", "LANDMARK-FAZ");
              foveaEntry.put("type", "Fovea_Centralis");
              foveaEntry.put("coordinates", Map.of("x", fx.doubleValue(), "y", fy.doubleValue(), "width", 44, "height", 44));
              foveaEntry.put("confidence", 0.98);
              foveaEntry.put("description", "Vùng vô mạch hoàng điểm (FAZ)");
              anomalyList.add(foveaEntry);
            }
          }
        }

        try {
          screening.setDetectedAnomalies(objectMapper.writeValueAsString(anomalyList));
        } catch (Exception ex) {
          log.warn("Không thể serialize detectedAnomalies: {}", ex.getMessage());
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

        // Ensure independent stroke risk is populated even if AI payload lacked explicit category
        if (screening.getStrokeRiskScore() == null) {
          if (screening.getAvRatio() != null || screening.getTortuosityIndex() != null || (screening.getDetectedAnomalies() != null && screening.getDetectedAnomalies().contains("AV_Nipping"))) {
            int calculatedStroke = computeIndependentStrokeScore(
                screening.getCardiovascularRiskScore(),
                screening.getAvRatio(),
                screening.getTortuosityIndex(),
                screening.getDetectedAnomalies()
            );
            screening.setStrokeRiskScore(calculatedStroke);
            screening.setStrokeRiskLevel(
                calculatedStroke >= criticalLimit ? "CRITICAL" :
                calculatedStroke >= highLimit ? "HIGH" :
                calculatedStroke >= modLimit ? "MODERATE" : "LOW"
            );
          } else if (screening.getCardiovascularRiskScore() != null) {
            screening.setStrokeRiskScore(screening.getCardiovascularRiskScore());
            screening.setStrokeRiskLevel(screening.getCardiovascularRiskLevel());
          }
        }

        // Ensure ETDRS grade is populated from anomalies even if predictions lacked explicit DR entry
        if (screening.getEtdrsGrade() == null) {
          screening.setEtdrsGrade(determineEtdrsGradeFromLesions(
              screening.getDetectedAnomalies(),
              screening.getDiabeticRetinopathyRiskScore() != null ? screening.getDiabeticRetinopathyRiskScore() : 0,
              screening.getDiabeticRetinopathyRiskLevel()
          ));
        }

        // --- MED-05 FIX: Emergency Risk Override Formula ---
        // Tuyệt đối không để điểm tim mạch nhẹ làm suy giảm ca cấp cứu nhãn khoa (PDR, xuất huyết diện rộng)
        int cvdScore = screening.getCardiovascularRiskScore() != null ? screening.getCardiovascularRiskScore() : 0;
        int drScore = screening.getDiabeticRetinopathyRiskScore() != null ? screening.getDiabeticRetinopathyRiskScore() : 0;
        int strokeScore = screening.getStrokeRiskScore() != null ? screening.getStrokeRiskScore() : 0;
        int maxOrganScore = Math.max(cvdScore, Math.max(drScore, strokeScore));

        boolean isPdrEmergency = screening.getEtdrsGrade() != null && screening.getEtdrsGrade().contains("Cấp độ 4");
        boolean isDrCritical = "CRITICAL".equalsIgnoreCase(screening.getDiabeticRetinopathyRiskLevel()) || drScore >= criticalLimit;
        boolean isCardioCritical = "CRITICAL".equalsIgnoreCase(screening.getCardiovascularRiskLevel()) || cvdScore >= criticalLimit;
        boolean isStrokeCritical = "CRITICAL".equalsIgnoreCase(screening.getStrokeRiskLevel()) || strokeScore >= criticalLimit;

        if (isPdrEmergency || isDrCritical || isCardioCritical || isStrokeCritical) {
          score = Math.max(score, maxOrganScore);
          calculatedRisk = RiskLevel.CRITICAL;
        } else if (maxOrganScore >= highLimit) {
          score = Math.max(score, maxOrganScore);
          if (calculatedRisk == RiskLevel.LOW || calculatedRisk == RiskLevel.MODERATE) {
            calculatedRisk = RiskLevel.HIGH;
          }
        }

        screening.setRiskScore(score);
        screening.setRiskLevel(calculatedRisk);
        screening.setAiRiskLevel(calculatedRisk);
        screening.setConfidence(confidence != null ? Math.round(confidence * 100.0) / 100.0 : null);
        screening.setFindings(findings);
        // --- FR-5: auto-generate health recommendations/warnings from the computed
        // risk level ---
        if (pub != null) {
          pub.publishScreeningProcessing(
              screening.getPatientId(),
              screening.getId(),
              "GENERATING_RESULT",
              4,
              5,
              "Trích xuất bản đồ & biomarkers",
              "Nhận diện vi phình mạch, xuất huyết & tính toán Biomarkers..."
          );
          pub.publishScreeningProcessing(
              screening.getPatientId(),
              screening.getId(),
              "SAVING_RESULT",
              5,
              5,
              "Lưu trữ kết quả",
              "Đang lưu kết quả & đồng bộ hồ sơ bệnh án..."
          );
        }
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
        if (pub != null) {
          pub.publishScreeningFailed(
              screening.getPatientId(),
              screening.getId(),
              "AI_INVALID_RESPONSE",
              "Dịch vụ AI trả về kết quả không hợp lệ. Ảnh chụp đã được lưu trữ an toàn."
          );
        }
      }
    } catch (Exception e) {
      log.error("AI service call failed (server offline or inference error): {}", e.getMessage());
      screening.setStatus(ScreeningStatus.FAILED);
      screening.setRiskLevel(null);
      screening.setAiRiskLevel(null);
      screening.setRiskScore(null);
      screening.setConfidence(null);
      screening.setDetectedAnomalies("[]");
      screening.setFindings(
          "Không thể kết nối đến máy chủ phân tích AI. Ảnh chụp võng mạc đã được lưu trữ an toàn để thẩm định lại.");
      var pub = getPublisher();
      if (pub != null) {
        pub.publishScreeningFailed(
            screening.getPatientId(),
            screening.getId(),
            "AI_INFERENCE_TIMEOUT",
            "Không thể kết nối đến máy chủ phân tích AI. Ảnh chụp võng mạc đã được lưu trữ an toàn để thẩm định lại."
        );
      }
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
            "/cds-viewer");

        if (saved.getDoctorId() != null) {
          userNotificationService.sendNotificationToUser(
              saved.getDoctorId(),
              "Ca khám mới cần thẩm định",
              "Bệnh nhân đã tải ảnh võng mạc và AI đã phân tích xong. Vui lòng kiểm tra và thẩm định ca khám.",
              "DOCTOR_REVIEW",
              "INFO",
              "/doctor/worklist");
        }

        var pub = getPublisher();
        if (pub != null) {
          Map<String, Object> biomarkersMap = new HashMap<>();
          if (saved.getAvRatio() != null) biomarkersMap.put("avRatio", saved.getAvRatio());
          if (saved.getVesselDensityPercent() != null) biomarkersMap.put("vesselDensityPercent", saved.getVesselDensityPercent());
          if (saved.getTortuosityIndex() != null) biomarkersMap.put("tortuosityIndex", saved.getTortuosityIndex());
          if (saved.getVerticalCdr() != null) biomarkersMap.put("verticalCdr", saved.getVerticalCdr());

          int detectedCount = 0;
          if (saved.getDetectedAnomalies() != null && !saved.getDetectedAnomalies().isBlank() && !saved.getDetectedAnomalies().equals("[]")) {
            try {
              List<?> anomalies = objectMapper.readValue(saved.getDetectedAnomalies(), List.class);
              detectedCount = anomalies != null ? anomalies.size() : 0;
            } catch (Exception ignored) {}
          }
          pub.publishScreeningCompleted(saved, biomarkersMap, detectedCount);
        }
      } else if (saved.getStatus() == ScreeningStatus.FAILED) {
        if (userNotificationService != null) {
          userNotificationService.sendNotificationToUser(
              patientId,
              "Phân tích ảnh võng mạc thất bại",
              saved.getFindings() != null ? saved.getFindings() : "Không thể hoàn tất phân tích AI. Lượt khám của bạn đã được bảo lưu/hoàn lại.",
              "AI_FAILED",
              "ERROR",
              "/screenings"
          );
        }
        var pub = getPublisher();
        if (pub != null) {
          pub.publishScreeningFailed(
              patientId,
              saved.getId(),
              "SCREENING_FAILED",
              saved.getFindings() != null ? saved.getFindings() : "Quá trình phân tích AI gặp sự cố"
          );
        }
      }
    } catch (Exception e) {
      log.warn("Không thể gửi thông báo AI_READY: {}", e.getMessage());
    }
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForPatient(UUID patientId) {
    if (patientId == null) {
      return List.of();
    }
    List<UUID> candidateIds = new ArrayList<>();
    candidateIds.add(patientId);

    if (patientProfileRepository != null) {
      patientProfileRepository.findByUserId(patientId).ifPresent(p -> {
        if (p.getId() != null && !candidateIds.contains(p.getId()))
          candidateIds.add(p.getId());
      });
      patientProfileRepository.findById(patientId).ifPresent(p -> {
        if (p.getUserId() != null && !candidateIds.contains(p.getUserId()))
          candidateIds.add(p.getUserId());
      });
    }

    if (patientMedicalProfileRepository != null) {
      patientMedicalProfileRepository.findByUserId(patientId).ifPresent(p -> {
        if (p.getId() != null && !candidateIds.contains(p.getId()))
          candidateIds.add(p.getId());
      });
      patientMedicalProfileRepository.findById(patientId).ifPresent(p -> {
        if (p.getUser() != null && p.getUser().getId() != null && !candidateIds.contains(p.getUser().getId())) {
          candidateIds.add(p.getUser().getId());
        }
      });
    }

    if (candidateIds.size() == 1) {
      return screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }
    return screeningRepository.findByPatientIdInOrderByCreatedAtDesc(candidateIds);
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForDoctor(UUID doctorId) {
    List<UUID> assignedPatientIds = new ArrayList<>();
    if (assignmentRepository != null) {
      List<UUID> ids = assignmentRepository.findPatientIdsByDoctorIdAndStatus(
          doctorId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
      if (ids != null) {
        assignedPatientIds.addAll(ids);
      }
    }

    if (userRepository != null && doctorId != null) {
      userRepository.findById(doctorId).ifPresent(doc -> {
        if (doc.getFullName() != null && !doc.getFullName().isBlank()) {
          String docName = doc.getFullName().trim();
          if (patientProfileRepository != null) {
            var profilesByDoctor = patientProfileRepository.findByAssignedDoctor(docName);
            if (profilesByDoctor != null) {
              for (var p : profilesByDoctor) {
                if (p.getUserId() != null && !assignedPatientIds.contains(p.getUserId())) {
                  assignedPatientIds.add(p.getUserId());
                }
                if (p.getId() != null && !assignedPatientIds.contains(p.getId())) {
                  assignedPatientIds.add(p.getId());
                }
              }
            }
          }
          if (patientMedicalProfileRepository != null) {
            var medProfilesByDoctor = patientMedicalProfileRepository.findByAssignedDoctor(docName);
            if (medProfilesByDoctor != null) {
              for (var med : medProfilesByDoctor) {
                if (med.getUser() != null && med.getUser().getId() != null
                    && !assignedPatientIds.contains(med.getUser().getId())) {
                  assignedPatientIds.add(med.getUser().getId());
                }
                if (med.getId() != null && !assignedPatientIds.contains(med.getId())) {
                  assignedPatientIds.add(med.getId());
                }
              }
            }
          }
        }
      });
    }

    if (assignedPatientIds.isEmpty()) {
      return List.of();
    }
    return screeningRepository.findByPatientIdInOrderByCreatedAtDesc(assignedPatientIds);
  }

  @Transactional(readOnly = true)
  public List<Screening> getAllScreenings() {
    return screeningRepository.findAllByOrderByCreatedAtDesc();
  }

  @Transactional(readOnly = true)
  public Page<Screening> getAllScreenings(Pageable pageable) {
    return screeningRepository.findAllByOrderByCreatedAtDesc(pageable);
  }

  @Transactional(readOnly = true)
  public Page<Screening> getScreeningsForPatient(UUID patientId, Pageable pageable) {
    if (patientId == null) {
      return Page.empty(pageable);
    }
    List<UUID> candidateIds = new ArrayList<>();
    candidateIds.add(patientId);

    if (patientProfileRepository != null) {
      patientProfileRepository.findByUserId(patientId).ifPresent(p -> {
        if (p.getId() != null && !candidateIds.contains(p.getId()))
          candidateIds.add(p.getId());
      });
      patientProfileRepository.findById(patientId).ifPresent(p -> {
        if (p.getUserId() != null && !candidateIds.contains(p.getUserId()))
          candidateIds.add(p.getUserId());
      });
    }

    if (patientMedicalProfileRepository != null) {
      patientMedicalProfileRepository.findByUserId(patientId).ifPresent(p -> {
        if (p.getId() != null && !candidateIds.contains(p.getId()))
          candidateIds.add(p.getId());
      });
      patientMedicalProfileRepository.findById(patientId).ifPresent(p -> {
        if (p.getUser() != null && p.getUser().getId() != null && !candidateIds.contains(p.getUser().getId())) {
          candidateIds.add(p.getUser().getId());
        }
      });
    }

    if (candidateIds.size() == 1) {
      return screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable);
    }
    return screeningRepository.findByPatientIdInOrderByCreatedAtDesc(candidateIds, pageable);
  }

  @Transactional(readOnly = true)
  public Page<Screening> getScreeningsForDoctor(UUID doctorId, Pageable pageable) {
    List<UUID> assignedPatientIds = new ArrayList<>();
    if (assignmentRepository != null) {
      List<UUID> ids = assignmentRepository.findPatientIdsByDoctorIdAndStatus(
          doctorId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
      if (ids != null) {
        assignedPatientIds.addAll(ids);
      }
    }

    if (userRepository != null && doctorId != null) {
      userRepository.findById(doctorId).ifPresent(doc -> {
        if (doc.getFullName() != null && !doc.getFullName().isBlank()) {
          String docName = doc.getFullName().trim();
          if (patientProfileRepository != null) {
            var profilesByDoctor = patientProfileRepository.findByAssignedDoctor(docName);
            if (profilesByDoctor != null) {
              for (var p : profilesByDoctor) {
                if (p.getUserId() != null && !assignedPatientIds.contains(p.getUserId())) {
                  assignedPatientIds.add(p.getUserId());
                }
                if (p.getId() != null && !assignedPatientIds.contains(p.getId())) {
                  assignedPatientIds.add(p.getId());
                }
              }
            }
          }
          if (patientMedicalProfileRepository != null) {
            var medProfilesByDoctor = patientMedicalProfileRepository.findByAssignedDoctor(docName);
            if (medProfilesByDoctor != null) {
              for (var med : medProfilesByDoctor) {
                if (med.getUser() != null && med.getUser().getId() != null
                    && !assignedPatientIds.contains(med.getUser().getId())) {
                  assignedPatientIds.add(med.getUser().getId());
                }
                if (med.getId() != null && !assignedPatientIds.contains(med.getId())) {
                  assignedPatientIds.add(med.getId());
                }
              }
            }
          }
        }
      });
    }

    if (assignedPatientIds.isEmpty()) {
      return doctorId != null
          ? screeningRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable)
          : Page.empty(pageable);
    }
    if (doctorId != null) {
      return screeningRepository.findByDoctorIdOrPatientIdInOrderByCreatedAtDesc(doctorId, assignedPatientIds, pageable);
    }
    return screeningRepository.findByPatientIdInOrderByCreatedAtDesc(assignedPatientIds, pageable);
  }

  @Transactional(readOnly = true)
  public Page<Screening> getScreeningsForClinic(UUID clinicId, Pageable pageable) {
    if (clinicId == null) {
      return Page.empty(pageable);
    }
    return screeningRepository.findByClinicIdOrderByCreatedAtDesc(clinicId, pageable);
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForClinic(UUID clinicId) {
    if (clinicId == null) {
      return List.of();
    }
    return screeningRepository.findByClinicIdOrderByCreatedAtDesc(clinicId);
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
    // --- MED-05 FIX: Đánh giá tổng hợp bác sĩ lấy mức nghiêm trọng cao nhất (Max-Rule) ---
    RiskLevel effectiveDoctorRisk = null;
    if (adjustedCardioRisk != null && adjustedDrRisk != null) {
      effectiveDoctorRisk = adjustedCardioRisk.compareTo(adjustedDrRisk) >= 0 ? adjustedCardioRisk : adjustedDrRisk;
    } else if (adjustedCardioRisk != null) {
      effectiveDoctorRisk = adjustedCardioRisk;
    } else if (adjustedDrRisk != null) {
      effectiveDoctorRisk = adjustedDrRisk;
    }

    if (effectiveDoctorRisk != null) {
      screening.setDoctorRiskLevel(effectiveDoctorRisk);
      screening.setRiskLevel(effectiveDoctorRisk);
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
          "/scan-history");
    } catch (Exception e) {
      log.warn("Không thể gửi thông báo DOCTOR_REVIEW: {}", e.getMessage());
    }

    try {
      var pub = getPublisher();
      if (pub != null) {
        String doctorName = "Bác sĩ chuyên khoa";
        if (userRepository != null && doctorId != null) {
          doctorName = userRepository.findById(doctorId)
              .map(u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getEmail())
              .orElse("Bác sĩ chuyên khoa");
        }
        pub.publishDoctorReviewed(saved, doctorName, decision, doctorNotes, icd10Codes);

        boolean isModified = decision == ReviewDecision.MODIFIED
            || (saved.getDoctorRiskLevel() != null && saved.getOriginalAiRiskLevel() != null
                && !saved.getDoctorRiskLevel().equals(saved.getOriginalAiRiskLevel()));
        if (isModified) {
          String origRisk = saved.getOriginalAiRiskLevel() != null ? saved.getOriginalAiRiskLevel().name() : "UNKNOWN";
          String adjRisk = saved.getRiskLevel() != null ? saved.getRiskLevel().name() : "MODIFIED";
          pub.publishDoctorOverride(saved, origRisk, adjRisk, doctorNotes != null ? doctorNotes : "Bác sĩ điều chỉnh phân tầng rủi ro lâm sàng");
        }
      }
    } catch (Exception e) {
      log.warn("Không thể publish STOMP DOCTOR_REVIEW: {}", e.getMessage());
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
   * Sinh danh mục lời khuyên y tế dựa trên mức độ rủi ro tổng thể do AI tính
   * toán.
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
      case UNVERIFIED -> "Chưa xác minh: Ca khám đang chờ bác sĩ chuyên khoa đánh giá và xác thực lâm sàng.";
    };
  }

  private Double toDouble(Object value) {
    if (value instanceof Number number) {
      return number.doubleValue();
    }
    return null;
  }

  /**
   * Chuẩn hóa phân độ ETDRS theo Quy tắc 4-2-1 quốc tế (AAO / Quyết định 3987/QĐ-BYT):
   * - Cấp độ 4 (PDR): Có tân mạch (Neovascularization NVD/NVE) hoặc xuất huyết dịch kính/trước võng mạc.
   * - Cấp độ 3 (NPDR nặng - Tiền tăng sinh): Thỏa quy tắc 4-2-1:
   *     + Xuất huyết vi mạch xuất hiện ở cả 4 góc phần tư võng mạc, HOẶC
   *     + Chuỗi hạt tĩnh mạch (Venous Beading) ở >= 2 góc phần tư, HOẶC
   *     + Bất thường vi mạch trong võng mạc (IRMA) ở >= 1 góc phần tư.
   * - Cấp độ 2 (NPDR trung bình): Tổn thương nhiều hơn vi phình mạch đơn thuần nhưng chưa đạt quy tắc 4-2-1.
   * - Cấp độ 1 (NPDR nhẹ): Chỉ có vi phình mạch (Microaneurysm).
   * - Cấp độ 0 (Không DR): Hoàn toàn không có tổn thương võng mạc đái tháo đường.
   */
  public String determineEtdrsGradeFromLesions(String detectedAnomaliesJson, int predScore, String predRiskLevel) {
    if (detectedAnomaliesJson == null || detectedAnomaliesJson.isBlank() || "[]".equals(detectedAnomaliesJson.trim())) {
      if ("CRITICAL".equalsIgnoreCase(predRiskLevel) || predScore >= 85) {
        return "Cấp độ 3 (NPDR nặng - Tiền tăng sinh)"; // Bảo vệ an toàn, không gán PDR khi chưa có bằng chứng tân mạch
      } else if ("HIGH".equalsIgnoreCase(predRiskLevel) || predScore >= 65) {
        return "Cấp độ 2 (NPDR trung bình)";
      } else if (predScore >= 25) {
        return "Cấp độ 1 (NPDR nhẹ - Vi phình mạch)";
      }
      return "Cấp độ 0 (Không DR)";
    }

    try {
      List<Map<String, Object>> anomalies = objectMapper.readValue(
          detectedAnomaliesJson, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
      if (anomalies == null || anomalies.isEmpty()) {
        return "Cấp độ 0 (Không DR)";
      }

      boolean hasNeovascularization = false;
      boolean hasIrma = false;
      boolean hasMicroaneurysm = false;
      boolean hasExudates = false;
      java.util.Set<Integer> hemQuadrants = new java.util.HashSet<>();
      java.util.Set<Integer> venousBeadingQuadrants = new java.util.HashSet<>();

      for (Map<String, Object> a : anomalies) {
        String type = String.valueOf(a.get("type")).toUpperCase(java.util.Locale.ROOT);
        Map<String, Object> coords = (Map<String, Object>) a.get("coordinates");
        int quadrant = determineQuadrant(coords);

        if (type.contains("NEOVASCULAR") || type.contains("NVD") || type.contains("NVE") || type.contains("VITREOUS_HEM")) {
          hasNeovascularization = true;
        }
        if (type.contains("IRMA") || type.contains("MICROVASCULAR_ABNORMAL")) {
          hasIrma = true;
        }
        if (type.contains("VENOUS_BEAD") || type.contains("BEADING")) {
          venousBeadingQuadrants.add(quadrant);
        }
        if (type.contains("HEMORRHAGE") || type.contains("XUAT_HUYET") || type.contains("BLEED")) {
          hemQuadrants.add(quadrant);
        }
        if (type.contains("MICROANEURYSM") || type.contains("VI_PHINH")) {
          hasMicroaneurysm = true;
        }
        if (type.contains("EXUDATE") || type.contains("COTTON_WOOL")) {
          hasExudates = true;
        }
      }

      // 1. Cấp độ 4: Tân mạch PDR
      if (hasNeovascularization || ("CRITICAL".equalsIgnoreCase(predRiskLevel) && (hasIrma || hemQuadrants.size() >= 4))) {
        return "Cấp độ 4 (PDR - Tăng sinh)";
      }

      // 2. Cấp độ 3: Quy tắc 4-2-1
      boolean rule4Met = hemQuadrants.size() >= 4;
      boolean rule2Met = venousBeadingQuadrants.size() >= 2;
      boolean rule1Met = hasIrma;
      if (rule4Met || rule2Met || rule1Met) {
        return "Cấp độ 3 (NPDR nặng - Tiền tăng sinh)";
      }

      // 3. Cấp độ 2: NPDR trung bình
      if (hasExudates || hemQuadrants.size() >= 1 || anomalies.size() >= 3) {
        return "Cấp độ 2 (NPDR trung bình)";
      }

      // 4. Cấp độ 1: Chỉ có vi phình mạch
      if (hasMicroaneurysm) {
        return "Cấp độ 1 (NPDR nhẹ - Vi phình mạch)";
      }

      return "Cấp độ 0 (Không DR)";
    } catch (Exception e) {
      log.warn("Lỗi phân tích tổn thương cho ETDRS 4-2-1: {}", e.getMessage());
      return predScore >= 70 ? "Cấp độ 2 (NPDR trung bình)" : "Cấp độ 1 (NPDR nhẹ)";
    }
  }

  private int determineQuadrant(Map<String, Object> coords) {
    if (coords == null) return 1;
    Double xVal = toDouble(coords.get("x"));
    Double yVal = toDouble(coords.get("y"));
    double x = xVal != null ? xVal : 50.0;
    double y = yVal != null ? yVal : 50.0;
    double cx = (x <= 1.0) ? 0.5 : 50.0;
    double cy = (y <= 1.0) ? 0.5 : 50.0;
    if (x >= cx && y < cy) return 1; // Superior-Temporal
    if (x < cx && y < cy) return 2;  // Superior-Nasal
    if (x < cx && y >= cy) return 3; // Inferior-Nasal
    return 4;                        // Inferior-Temporal
  }

  private int computeIndependentStrokeScore(Integer cvdScore, Double avRatio, Double tortuosity, String anomaliesJson) {
    double score = cvdScore != null ? cvdScore * 0.5 : 20.0;
    if (avRatio != null) {
      if (avRatio < 0.55) {
        score += 35.0; // Hẹp tiểu động mạch rất nặng (<0.55)
      } else if (avRatio < 0.60) {
        score += 25.0; // Hẹp tiểu động mạch rõ (<0.60)
      } else if (avRatio < 0.65) {
        score += 12.0; // Co nhẹ vi mạch
      }
    }
    if (tortuosity != null) {
      if (tortuosity > 1.30) {
        score += 20.0; // Xoắn vặn vi mạch đáng kể
      } else if (tortuosity > 1.20) {
        score += 10.0;
      }
    }
    if (anomaliesJson != null && (anomaliesJson.contains("AV_Nipping") || anomaliesJson.contains("Focal_Narrowing") || anomaliesJson.contains("AV_NIP") || anomaliesJson.contains("GUNN") || anomaliesJson.contains("Salus"))) {
      score += 20.0; // Dấu hiệu bắt chéo Gunn / Salus sign đặc hiệu cho xơ vữa tiểu động mạch não
    }
    return (int) Math.min(95, Math.max(5, Math.round(score)));
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
      if (patientMedicalProfileRepository != null) {
        var medProfileByUserId = patientMedicalProfileRepository.findByUserId(userId);
        if (medProfileByUserId.isPresent() && medProfileByUserId.get().getId().equals(screening.getPatientId())) {
          return true;
        }
        var medProfileById = patientMedicalProfileRepository.findById(screening.getPatientId());
        if (medProfileById.isPresent() && medProfileById.get().getUser() != null
            && userId.equals(medProfileById.get().getUser().getId())) {
          return true;
        }
      }
    } else {
      // Cho phép xóa nếu patientId là null (ca khám chưa gán hoặc phát sinh trong
      // phiên người dùng)
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
    if (screening.getPatientId() != null) {
      if (assignmentRepository != null) {
        if (assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
            userId, screening.getPatientId(), com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
          return true;
        }
      }

      String doctorFullName = (userRepository != null)
          ? userRepository.findById(userId).map(com.aura.user.entity.User::getFullName).orElse(null)
          : null;

      if (patientProfileRepository != null) {
        var profile = patientProfileRepository.findById(screening.getPatientId())
            .or(() -> patientProfileRepository.findByUserId(screening.getPatientId()));
        if (profile.isPresent()) {
          var p = profile.get();
          if (p.getUserId() != null && assignmentRepository != null
              && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
                  userId, p.getUserId(), com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
            return true;
          }
          if (doctorFullName != null && !doctorFullName.isBlank() && p.getAssignedDoctor() != null &&
              doctorFullName.trim().equalsIgnoreCase(p.getAssignedDoctor().trim())) {
            return true;
          }
        }
      }

      if (patientMedicalProfileRepository != null) {
        var medProfile = patientMedicalProfileRepository.findById(screening.getPatientId())
            .or(() -> patientMedicalProfileRepository.findByUserId(screening.getPatientId()));
        if (medProfile.isPresent()) {
          var med = medProfile.get();
          if (med.getUser() != null && assignmentRepository != null
              && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
                  userId, med.getUser().getId(), com.aura.doctor.entity.AssignmentStatus.ACTIVE)) {
            return true;
          }
          if (doctorFullName != null && !doctorFullName.isBlank() && med.getAssignedDoctor() != null &&
              doctorFullName.trim().equalsIgnoreCase(med.getAssignedDoctor().trim())) {
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

    if (isOwner && !isAdmin) {
      throw new AuthException(
          ErrorCode.ACCESS_DENIED,
          "Bệnh nhân không được phép xóa kết quả sàng lọc y tế nhằm đảm bảo tính toàn vẹn hồ sơ bệnh án.");
    }

    if (!isAdmin && !isDoctorAssigned && !isClinicMember) {
      throw new AuthException(
          ErrorCode.ACCESS_DENIED,
          "Bạn không có quyền xóa ca sàng lọc này");
    }
    screeningRepository.delete(screening);
    screeningRepository.flush();
    log.info("Đã xóa ca sàng lọc {} bởi người dùng {} (isAdmin={}, isOwner={}, isDoctorAssigned={})", screeningId,
        userId, isAdmin, isOwner, isDoctorAssigned);
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
        } else {
          log.warn("Người dùng {} không có quyền xóa ca sàng lọc {}", userId, id);
        }
      });
    }
    if (!toDelete.isEmpty()) {
      screeningRepository.deleteAll(toDelete);
      screeningRepository.flush();
      log.info("Đã xóa hàng loạt {} ca sàng lọc bởi người dùng {} (isAdmin={})", toDelete.size(), userId, isAdmin);
    }
    return toDelete.size();
  }
}
