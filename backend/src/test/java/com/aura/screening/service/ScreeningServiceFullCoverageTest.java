package com.aura.screening.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

@ExtendWith(MockitoExtension.class)
class ScreeningServiceFullCoverageTest {

  @Mock
  private ScreeningRepository screeningRepository;

  @Mock
  private DoctorPatientAssignmentRepository assignmentRepository;

  @Mock
  private UserNotificationService userNotificationService;

  @Mock
  private GeminiRetinalAiService geminiAiService;

  private ScreeningService screeningService;

  @BeforeEach
  void setUp() {
    screeningService = new ScreeningService(
        screeningRepository,
        assignmentRepository,
        userNotificationService,
        geminiAiService,
        RestClient.builder()
    );
    ReflectionTestUtils.setField(screeningService, "signatureSecret", "TEST_SECRET_2026");
  }

  @Test
  @DisplayName("createScreening với request đầy đủ metadata (OS, scanType, fileName, fileSize, mimeType)")
  void createScreening_withFullRequestMetadata() {
    UUID patientId = UUID.randomUUID();
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/fundus_os.png",
        "OS",
        "OCT",
        "fundus_os.png",
        102400L,
        "image/png",
        null,
        0.65,
        "18.2%",
        null
    );

    Map<String, Object> aiMap = new HashMap<>();
    aiMap.put("overallVascularRiskScore", 70);
    aiMap.put("confidence", 0.94);

    when(geminiAiService.analyzeRetinalVascular("OS", "https://cdn.aura.test/fundus_os.png"))
        .thenReturn(aiMap);
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, req);

    assertThat(saved.getEyePosition()).isEqualTo("OS");
    assertThat(saved.getScanType()).isEqualTo("OCT");
    assertThat(saved.getFileName()).isEqualTo("fundus_os.png");
    assertThat(saved.getFileSize()).isEqualTo(102400L);
    assertThat(saved.getMimeType()).isEqualTo("image/png");
    assertThat(saved.getAvRatio()).isEqualTo(0.65);
    assertThat(saved.getRiskScore()).isEqualTo(70);
    assertThat(saved.getRiskLevel()).isEqualTo(RiskLevel.HIGH);
    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);

    verify(userNotificationService).sendNotificationToUser(
        eq(patientId),
        eq("Kết quả phân tích AI đã sẵn sàng"),
        anyString(),
        eq("AI_READY"),
        eq("WARNING"), // RiskLevel.HIGH -> WARNING
        eq("/cds-viewer")
    );
  }

  @Test
  @DisplayName("createScreening với request có eyePosition và scanType rỗng -> mặc định 'OD' và 'Fundus'")
  void createScreening_withBlankEyeAndScanType_defaultsToODAndFundus() {
    UUID patientId = UUID.randomUUID();
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/scan.png",
        "   ",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );

    when(geminiAiService.analyzeRetinalVascular(eq("OD"), anyString()))
        .thenReturn(Map.of("overallVascularRiskScore", 25));
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, req);

    assertThat(saved.getEyePosition()).isEqualTo("OD");
    assertThat(saved.getScanType()).isEqualTo("Fundus");
    assertThat(saved.getRiskLevel()).isEqualTo(RiskLevel.LOW);
  }

  @Test
  @DisplayName("createScreening bằng imageUrl trực tiếp (overload method)")
  void createScreening_withDirectImageUrl() {
    UUID patientId = UUID.randomUUID();
    String url = "https://cdn.aura.test/eye_direct.png";

    when(geminiAiService.analyzeRetinalVascular("OD", url))
        .thenReturn(Map.of("overallVascularRiskScore", 85));
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, url);

    assertThat(saved.getEyePosition()).isEqualTo("OD");
    assertThat(saved.getScanType()).isEqualTo("Fundus");
    assertThat(saved.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);

    verify(userNotificationService).sendNotificationToUser(
        eq(patientId),
        eq("Kết quả phân tích AI đã sẵn sàng"),
        anyString(),
        eq("AI_READY"),
        eq("CRITICAL"), // CRITICAL severity
        eq("/cds-viewer")
    );
  }

  @Test
  @DisplayName("calculateRiskLevel cho 4 ngưỡng điểm: CRITICAL (>=80), HIGH (>=65), MODERATE (>=40), LOW (<40)")
  void calculateRiskLevel_fourScoreThresholds() {
    UUID patientId = UUID.randomUUID();
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // 1. CRITICAL (80)
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("overallVascularRiskScore", 80));
    Screening s1 = screeningService.createScreening(patientId, "url");
    assertThat(s1.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);

    // 2. HIGH (65)
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("overallVascularRiskScore", 65));
    Screening s2 = screeningService.createScreening(patientId, "url");
    assertThat(s2.getRiskLevel()).isEqualTo(RiskLevel.HIGH);

    // 3. MODERATE (40)
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("overallVascularRiskScore", 40));
    Screening s3 = screeningService.createScreening(patientId, "url");
    assertThat(s3.getRiskLevel()).isEqualTo(RiskLevel.MODERATE);

    // 4. LOW (39)
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("overallVascularRiskScore", 39));
    Screening s4 = screeningService.createScreening(patientId, "url");
    assertThat(s4.getRiskLevel()).isEqualTo(RiskLevel.LOW);
  }

  @Test
  @DisplayName("fallback sang overallRiskScore và riskScore khi overallVascularRiskScore không có")
  void calculateRiskLevel_fallbackScoreFields() {
    UUID patientId = UUID.randomUUID();
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // Fallback 1: overallRiskScore
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("overallRiskScore", 55));
    Screening s1 = screeningService.createScreening(patientId, "url");
    assertThat(s1.getRiskScore()).isEqualTo(55);
    assertThat(s1.getRiskLevel()).isEqualTo(RiskLevel.MODERATE);

    // Fallback 2: riskScore
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("riskScore", 72));
    Screening s2 = screeningService.createScreening(patientId, "url");
    assertThat(s2.getRiskScore()).isEqualTo(72);
    assertThat(s2.getRiskLevel()).isEqualTo(RiskLevel.HIGH);

    // Missing all risk scores -> exception caught -> status FAILED
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("otherField", 123));
    Screening s3 = screeningService.createScreening(patientId, "url");
    assertThat(s3.getStatus()).isEqualTo(ScreeningStatus.FAILED);
    assertThat(s3.getRiskScore()).isNull();
  }

  @Test
  @DisplayName("Xử lý predictions array cho Cardiovascular, Hypertensive, Diabetic Retinopathy, biomarkers và heatmap")
  void executeAiAnalysis_populatesPredictionsBiomarkersAndHeatmap() {
    UUID patientId = UUID.randomUUID();
    Map<String, Object> aiMap = new HashMap<>();
    aiMap.put("overallVascularRiskScore", 68);
    aiMap.put("confidence", 0.91);

    List<Map<String, Object>> predictions = List.of(
        Map.of(
            "category", "Cardiovascular Risk",
            "confidence", 0.75,
            "riskLevel", "HIGH",
            "clinicalNote", "Hẹp tiểu động mạch vùng cận hoàng điểm"
        ),
        Map.of(
            "category", "Diabetic Retinopathy",
            "confidence", 0.35,
            "riskLevel", "LOW",
            "clinicalNote", "Không có xuất huyết"
        )
    );
    aiMap.put("predictions", predictions);

    Map<String, Object> biomarkers = Map.of(
        "avRatio", 0.61,
        "vesselDensityPercent", 16.8,
        "tortuosityIndex", 1.14,
        "verticalCdr", 0.36
    );
    aiMap.put("biomarkers", biomarkers);
    aiMap.put("heatmapBase64", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");
    aiMap.put("xaiRationale", "Mô hình Grad-CAM chú ý vào cung mạch trên");

    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(aiMap);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");

    assertThat(saved.getCardiovascularRiskScore()).isEqualTo(75);
    assertThat(saved.getCardiovascularRiskLevel()).isEqualTo("HIGH");
    assertThat(saved.getStrokeRiskScore()).isEqualTo(75);
    assertThat(saved.getStrokeRiskLevel()).isEqualTo("HIGH");
    assertThat(saved.getHypertensionRiskScore()).isEqualTo(75);
    assertThat(saved.getHypertensionRiskLevel()).isEqualTo("HIGH");
    assertThat(saved.getDiabeticRetinopathyRiskScore()).isEqualTo(35);
    assertThat(saved.getDiabeticRetinopathyRiskLevel()).isEqualTo("LOW");

    assertThat(saved.getAvRatio()).isEqualTo(0.61);
    assertThat(saved.getVesselDensityPercent()).isEqualTo(16.8);
    assertThat(saved.getTortuosityIndex()).isEqualTo(1.14);
    assertThat(saved.getVerticalCdr()).isEqualTo(0.36);

    assertThat(saved.getHeatmapBase64()).isEqualTo("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");
    assertThat(saved.getFindings()).isEqualTo("Hẹp tiểu động mạch vùng cận hoàng điểm");
  }

  @Test
  @DisplayName("Khi AI trả về null -> ca khám chuyển FAILED, riskScore/confidence = null, thông báo không gửi")
  void executeAiAnalysis_whenAiReturnsNull_marksFailed() {
    UUID patientId = UUID.randomUUID();
    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(null);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/fail.png");

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.FAILED);
    assertThat(saved.getRiskScore()).isNull();
    assertThat(saved.getRiskLevel()).isNull();
    assertThat(saved.getAiRiskLevel()).isNull();
    assertThat(saved.getConfidence()).isNull();
    assertThat(saved.getFindings()).contains("Dịch vụ AI trả về kết quả không hợp lệ");

    verify(userNotificationService, never()).sendNotificationToUser(any(), any(), any(), any(), any(), any());
  }

  @Test
  @DisplayName("Khi gửi thông báo AI_READY gặp ngoại lệ -> bắt lỗi an toàn và không gây hỏng ca khám")
  void sendAiReadyNotification_whenNotificationFails_logsAndContinues() {
    UUID patientId = UUID.randomUUID();
    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenReturn(Map.of("overallVascularRiskScore", 45));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    doThrow(new RuntimeException("WebSocket push failed"))
        .when(userNotificationService)
        .sendNotificationToUser(any(), any(), any(), any(), any(), any());

    Screening saved = screeningService.createScreening(patientId, "url");
    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);
  }

  @Test
  @DisplayName("addDoctorReview thành công với MODIFIED, cập nhật rủi ro, ghi chú, mã ICD-10 và sinh chữ ký HMAC-SHA256")
  void addDoctorReview_withModifiedDecision_success() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();

    Screening screening = new Screening(patientId, "https://cdn.aura.test/scan.png");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setRiskLevel(RiskLevel.HIGH);

    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening reviewed = screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.MODIFIED,
        "Điều chỉnh sau hội chẩn lâm sàng",
        RiskLevel.MODERATE,
        RiskLevel.LOW,
        List.of("H35.0", "I10")
    );

    assertThat(reviewed.getDoctorId()).isEqualTo(doctorId);
    assertThat(reviewed.getDoctorNotes()).isEqualTo("Điều chỉnh sau hội chẩn lâm sàng");
    assertThat(reviewed.getReviewDecision()).isEqualTo(ReviewDecision.MODIFIED);
    assertThat(reviewed.getDoctorCardiovascularRiskLevel()).isEqualTo(RiskLevel.MODERATE);
    assertThat(reviewed.getDoctorDiabeticRetinopathyRiskLevel()).isEqualTo(RiskLevel.LOW);
    assertThat(reviewed.getDoctorRiskLevel()).isEqualTo(RiskLevel.MODERATE);
    assertThat(reviewed.getRiskLevel()).isEqualTo(RiskLevel.MODERATE);
    assertThat(reviewed.getOriginalAiRiskLevel()).isEqualTo(RiskLevel.HIGH);
    assertThat(reviewed.getStatus()).isEqualTo(ScreeningStatus.REVIEWED);
    assertThat(reviewed.getIcd10Codes()).isEqualTo("H35.0\nI10");
    assertThat(reviewed.getDigitalSignature()).startsWith("HMAC-SHA256:");
    assertThat(reviewed.getSignedAt()).isNotNull();

    verify(userNotificationService).sendNotificationToUser(
        eq(patientId),
        eq("Bác sĩ đã thẩm định kết quả"),
        anyString(),
        eq("DOCTOR_REVIEW"),
        eq("INFO"),
        eq("/scan-history")
    );
  }

  @Test
  @DisplayName("addDoctorReview khi MODIFIED nhưng cả adjustedCardioRisk và adjustedDrRisk đều null -> ném IllegalArgumentException")
  void addDoctorReview_whenModifiedWithoutAdjustedRisks_throwsIllegalArgumentException() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();

    Screening screening = new Screening(UUID.randomUUID(), "url");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));

    assertThatThrownBy(() -> screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.MODIFIED,
        "Không có rủi ro",
        null,
        null,
        null
    )).isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("Thẩm định MODIFIED phải có ít nhất một mức nguy cơ điều chỉnh");
  }

  @Test
  @DisplayName("addDoctorReview khi adjustedCardioRisk null nhưng adjustedDrRisk có giá trị -> gán doctorRiskLevel bằng adjustedDrRisk")
  void addDoctorReview_whenCardioRiskNullAndDrRiskPresent_setsDoctorRiskToDrRisk() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();

    Screening screening = new Screening(UUID.randomUUID(), "url");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening reviewed = screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.MODIFIED,
        "Chỉ điều chỉnh DR",
        null,
        RiskLevel.CRITICAL,
        null
    );

    assertThat(reviewed.getDoctorRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
    assertThat(reviewed.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
  }

  @Test
  @DisplayName("getScreeningsForDoctor trả về danh sách ca khám của các bệnh nhân được chỉ định")
  void getScreeningsForDoctor() {
    UUID doctorId = UUID.randomUUID();
    UUID p1 = UUID.randomUUID();
    UUID p2 = UUID.randomUUID();
    List<UUID> patientIds = List.of(p1, p2);

    Screening s1 = new Screening(p1, "url1");
    Screening s2 = new Screening(p2, "url2");

    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(patientIds);
    when(screeningRepository.findByPatientIdInOrderByCreatedAtDesc(patientIds))
        .thenReturn(List.of(s1, s2));

    List<Screening> result = screeningService.getScreeningsForDoctor(doctorId);
    assertThat(result).hasSize(2);
  }

  @Test
  @DisplayName("getScreeningsForDoctor khi bác sĩ không có bệnh nhân được phân công -> trả về danh sách rỗng")
  void getScreeningsForDoctor_whenNoPatients_returnsEmpty() {
    UUID doctorId = UUID.randomUUID();
    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of());

    List<Screening> result = screeningService.getScreeningsForDoctor(doctorId);
    assertThat(result).isEmpty();
  }

  @Test
  @DisplayName("getScreeningsForPatient trả về danh sách ca khám theo patientId")
  void getScreeningsForPatient() {
    UUID patientId = UUID.randomUUID();
    Screening s = new Screening(patientId, "url");
    when(screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(List.of(s));

    List<Screening> list = screeningService.getScreeningsForPatient(patientId);
    assertThat(list).hasSize(1);
  }

  @Test
  @DisplayName("getAllScreenings trả về tất cả ca khám")
  void getAllScreenings() {
    Screening s = new Screening(UUID.randomUUID(), "url");
    when(screeningRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(s));

    List<Screening> list = screeningService.getAllScreenings();
    assertThat(list).hasSize(1);
  }

  @Test
  @DisplayName("getScreeningById trả về ca khám khi tồn tại hoặc ném ResourceNotFoundException khi không tồn tại")
  void getScreeningById() {
    UUID id = UUID.randomUUID();
    Screening s = new Screening(UUID.randomUUID(), "url");
    when(screeningRepository.findById(id)).thenReturn(Optional.of(s));

    assertThat(screeningService.getScreeningById(id)).isSameAs(s);

    UUID notFoundId = UUID.randomUUID();
    when(screeningRepository.findById(notFoundId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> screeningService.getScreeningById(notFoundId))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  @DisplayName("generateRecommendations sinh văn bản khuyến nghị chính xác cho từng mức rủi ro và trường hợp null")
  void generateRecommendations_allRiskLevelsAndNull() throws Exception {
    Method recMethod = ScreeningService.class.getDeclaredMethod("generateRecommendations", RiskLevel.class);
    recMethod.setAccessible(true);

    String criticalRec = (String) recMethod.invoke(screeningService, RiskLevel.CRITICAL);
    assertThat(criticalRec).contains("Nguy cơ RẤT CAO");

    String highRec = (String) recMethod.invoke(screeningService, RiskLevel.HIGH);
    assertThat(highRec).contains("Nguy cơ CAO");

    String modRec = (String) recMethod.invoke(screeningService, RiskLevel.MODERATE);
    assertThat(modRec).contains("Nguy cơ TRUNG BÌNH");

    String lowRec = (String) recMethod.invoke(screeningService, RiskLevel.LOW);
    assertThat(lowRec).contains("Nguy cơ THẤP");

    String nullRec = (String) recMethod.invoke(screeningService, (RiskLevel) null);
    assertThat(nullRec).contains("Không thể sinh khuyến nghị");
  }
}
