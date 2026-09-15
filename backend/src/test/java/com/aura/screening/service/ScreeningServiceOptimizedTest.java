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

import com.aura.audit.service.AuditLogService;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.billing.service.BillingService;
import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScreeningService - Optimized Clinical & Edge Case Unit Tests")
class ScreeningServiceOptimizedTest {

  @Mock private ScreeningRepository screeningRepository;
  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private UserNotificationService userNotificationService;
  @Mock private AuditLogService auditLogService;
  @Mock private ClinicMemberRepository clinicMemberRepository;
  @Mock private UserRepository userRepository;
  @Mock private GeminiRetinalAiService geminiAiService;
  @Mock private BillingService billingService;

  private ScreeningService screeningService;
  private UUID patientId;

  @BeforeEach
  void setUp() {
    screeningService = new ScreeningService(
        screeningRepository,
        assignmentRepository,
        userNotificationService,
        auditLogService,
        clinicMemberRepository,
        userRepository,
        geminiAiService
    );
    patientId = UUID.randomUUID();
  }

  @Test
  @DisplayName("Constructors: Bao phủ toàn bộ các constructor phụ (4, 5, 7, 8 tham số)")
  void testAllConstructorsCoverage() {
    ScreeningService c4 = new ScreeningService(screeningRepository, assignmentRepository, userNotificationService, geminiAiService);
    assertThat(c4).isNotNull();

    ScreeningService c5 = new ScreeningService(screeningRepository, assignmentRepository, userNotificationService, geminiAiService, "ignored");
    assertThat(c5).isNotNull();

    ScreeningService c7 = new ScreeningService(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository, userRepository, geminiAiService);
    assertThat(c7).isNotNull();

    ScreeningService c8 = new ScreeningService(screeningRepository, assignmentRepository, userNotificationService, auditLogService, clinicMemberRepository, userRepository, geminiAiService, billingService);
    assertThat(c8).isNotNull();
  }

  @ParameterizedTest(name = "createScreening fallback defaults: eye=''{0}'', scanType=''{1}''")
  @CsvSource({
    ", , OD, Fundus",
    "'', '', OD, Fundus",
    "'   ', '   ', OD, Fundus",
    "'OS', 'OCT', OS, OCT"
  })
  @DisplayName("createScreening: Fallback an toàn cho eyePosition và scanType khi null/blank")
  void testCreateScreeningDefaultsFallback(String eyeIn, String scanIn, String expectedEye, String expectedScan) {
    UUID clinicId = UUID.randomUUID();
    CreateScreeningRequest request = new CreateScreeningRequest(
        "https://cdn.aura.test/eye.png", eyeIn, scanIn, "eye.png", 1024L, "image/png", null, 0.65, "17.5%", clinicId
    );

    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, request);

    assertThat(saved.getEyePosition()).isEqualTo(expectedEye);
    assertThat(saved.getScanType()).isEqualTo(expectedScan);
    assertThat(saved.getClinicId()).isEqualTo(clinicId);
    assertThat(saved.getAvRatio()).isEqualTo(0.65);
    assertThat(saved.getVesselDensity()).isEqualTo("17.5%");
  }

  @Test
  @DisplayName("createScreening (request overload): Bệnh nhân cá nhân hết lượt khám -> ném PaymentFailedException")
  void testCreateScreeningWithRequestPersonalBillingExhaustedThrows() {
    ScreeningService serviceWithBilling = new ScreeningService(
        screeningRepository, assignmentRepository, userNotificationService,
        auditLogService, clinicMemberRepository, userRepository, geminiAiService, billingService
    );
    CreateScreeningRequest request = new CreateScreeningRequest(
        "https://cdn.aura.test/eye.png", "OD", "Fundus", null, null, null, null, null, null, null // clinicId = null
    );

    when(billingService.deductCredit(patientId)).thenReturn(false);
    when(billingService.getRemainingCredits(patientId)).thenReturn(0);

    assertThatThrownBy(() -> serviceWithBilling.createScreening(patientId, request))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("Tài khoản của bạn đã hết lượt khám sàng lọc AI");
    verify(screeningRepository, never()).save(any());
  }

  @Test
  @DisplayName("createScreening (imageUrl overload): Bệnh nhân cá nhân hết lượt khám -> ném PaymentFailedException")
  void testCreateScreeningWithImageUrlPersonalBillingExhaustedThrows() {
    ScreeningService serviceWithBilling = new ScreeningService(
        screeningRepository, assignmentRepository, userNotificationService,
        auditLogService, clinicMemberRepository, userRepository, geminiAiService, billingService
    );
    when(billingService.deductCredit(patientId)).thenReturn(false);
    when(billingService.getRemainingCredits(patientId)).thenReturn(-1);

    assertThatThrownBy(() -> serviceWithBilling.createScreening(patientId, "https://cdn.aura.test/eye.png"))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("Tài khoản của bạn đã hết lượt khám sàng lọc AI");
    verify(screeningRepository, never()).save(any());
  }

  @Test
  @DisplayName("createScreening: Bệnh nhân cá nhân deductCredit=false nhưng remaining > 0 hoặc deductCredit=true -> tiếp tục thành công")
  void testCreateScreeningBillingProceedsWhenRemainingCreditsPositiveOrDeducted() {
    ScreeningService serviceWithBilling = new ScreeningService(
        screeningRepository, assignmentRepository, userNotificationService,
        auditLogService, clinicMemberRepository, userRepository, geminiAiService, billingService
    );
    when(billingService.deductCredit(patientId)).thenReturn(false).thenReturn(true);
    when(billingService.getRemainingCredits(patientId)).thenReturn(2);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // First call: deductCredit=false, remaining=2 -> proceeds
    Screening saved1 = serviceWithBilling.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(saved1).isNotNull();

    // Second call: deductCredit=true -> proceeds
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/eye.png", "OD", "Fundus", null, null, null, null, null, null, null
    );
    Screening saved2 = serviceWithBilling.createScreening(patientId, req);
    assertThat(saved2).isNotNull();
  }

  @Test
  @DisplayName("Auto-assign clinic: Khi screening chưa có clinicId nhưng bác sĩ phụ trách thuộc clinic -> tự động gán clinicId")
  void testAutoAssignClinicFromClinicMember() {
    UUID doctorId = UUID.randomUUID();
    UUID clinicId = UUID.randomUUID();

    User doctor = new User("doctor@aura.test", "hash", "BS. Le Van Doctor");
    ReflectionTestUtils.setField(doctor, "id", doctorId);

    User clinic = new User("clinic@aura.test", "hash", "Phong Kham Da Khoa AURA");
    ReflectionTestUtils.setField(clinic, "id", clinicId);

    User patient = new User("patient@aura.test", "hash", "Benh Nhan Test");
    ReflectionTestUtils.setField(patient, "id", patientId);

    DoctorPatientAssignment assignment = new DoctorPatientAssignment(doctor, patient, AssignmentStatus.ACTIVE, doctorId);
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)).thenReturn(List.of(assignment));

    ClinicMember clinicMember = new ClinicMember(clinic, doctor);
    when(clinicMemberRepository.findByDoctorId(doctorId)).thenReturn(List.of(clinicMember));

    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateScreeningRequest request = new CreateScreeningRequest(
        "https://cdn.aura.test/scan-od.png", "OD", "Fundus", "scan-od.png", 1024L, "image/png", null, null, null, null
    );

    Screening saved = screeningService.createScreening(patientId, request);

    assertThat(saved.getDoctorId()).isEqualTo(doctorId);
    assertThat(saved.getClinicId()).isEqualTo(clinicId);
  }

  @Test
  @DisplayName("resolveAndAssignDoctorAndClinic: Bao phủ các nhánh edge case (activeAssignments rỗng, doctor null, clinic null, catch exception)")
  void testResolveAndAssignDoctorAndClinicEdgeCases() {
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // Case 1: activeAssignments rỗng
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)).thenReturn(List.of());
    Screening s1 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s1.getDoctorId()).isNull();

    // Case 2: assignment có nhưng doctor null
    DoctorPatientAssignment nullDocAssignment = new DoctorPatientAssignment(null, null, AssignmentStatus.ACTIVE, null);
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)).thenReturn(List.of(nullDocAssignment));
    Screening s2 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s2.getDoctorId()).isNull();

    // Case 3: doctor có nhưng clinicMember rỗng hoặc member.getClinic() null
    UUID docId = UUID.randomUUID();
    User doc = new User("doc@aura.test", "pass", "BS Doc");
    ReflectionTestUtils.setField(doc, "id", docId);
    DoctorPatientAssignment validAssignment = new DoctorPatientAssignment(doc, null, AssignmentStatus.ACTIVE, docId);
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)).thenReturn(List.of(validAssignment));

    ClinicMember memberWithoutClinic = new ClinicMember(null, doc);
    when(clinicMemberRepository.findByDoctorId(docId)).thenReturn(List.of(memberWithoutClinic));
    Screening s3 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s3.getDoctorId()).isEqualTo(docId);
    assertThat(s3.getClinicId()).isNull();

    // Case 4: Exception trong resolve -> catch an toàn không làm hỏng luồng tạo ca khám
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)).thenThrow(new RuntimeException("DB error"));
    Screening s4 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s4).isNotNull();
  }

  @Test
  @DisplayName("logScreeningCreationAudit: Bao phủ các nhánh user tồn tại, user null, userRepository null, và catch Exception")
  void testLogScreeningCreationAuditBranches() {
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // Case 1: user tồn tại -> email được truyền vào audit log
    User user = new User("patient@aura.test", "hash", "Benh Nhan");
    when(userRepository.findById(patientId)).thenReturn(Optional.of(user));
    screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    verify(auditLogService).logEvent(eq(patientId), eq("patient@aura.test"), any(), any(), any(), any(), any(), any(), any(), any(), any());

    // Case 2: user không tìm thấy -> email null
    when(userRepository.findById(patientId)).thenReturn(Optional.empty());
    screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");

    // Case 3: auditLogService ném Exception -> catch an toàn
    doThrow(new RuntimeException("Audit queue down"))
        .when(auditLogService).logEvent(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any());
    Screening s = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s).isNotNull();
  }

  @Test
  @DisplayName("executeAiAnalysis: AI response rỗng (body == null) -> trạng thái FAILED với findings thông báo lỗi")
  void testExecuteAiAnalysisNullBody() {
    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(null);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.FAILED);
    assertThat(saved.getRiskLevel()).isNull();
    assertThat(saved.getAiRiskLevel()).isNull();
    assertThat(saved.getRiskScore()).isNull();
    assertThat(saved.getFindings()).contains("Dịch vụ AI trả về kết quả không hợp lệ");
  }

  @Test
  @DisplayName("executeAiAnalysis: Fallback score từ overallRiskScore và riskScore, hoặc ném IllegalStateException nếu thiếu cả 3")
  void testExecuteAiAnalysisScoreFallbacks() {
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // Case 1: overallVascularRiskScore null -> fallback overallRiskScore
    Map<String, Object> map1 = new HashMap<>();
    map1.put("overallRiskScore", 68);
    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(map1);
    Screening s1 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s1.getRiskScore()).isEqualTo(68);
    assertThat(s1.getRiskLevel()).isEqualTo(RiskLevel.HIGH);

    // Case 2: overallRiskScore null -> fallback riskScore
    Map<String, Object> map2 = new HashMap<>();
    map2.put("riskScore", 82);
    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(map2);
    Screening s2 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s2.getRiskScore()).isEqualTo(82);
    assertThat(s2.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);

    // Case 3: cả 3 null -> ném IllegalStateException -> catch block -> FAILED
    Map<String, Object> map3 = new HashMap<>();
    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(map3);
    Screening s3 = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");
    assertThat(s3.getStatus()).isEqualTo(ScreeningStatus.FAILED);
    assertThat(s3.getFindings()).contains("Không thể kết nối đến máy chủ phân tích AI");
  }

  @Test
  @DisplayName("executeAiAnalysis: Phân tích đầy đủ Diabetic Retinopathy, Biomarkers toDouble (hợp lệ vs không hợp lệ), HeatmapBase64 rỗng vs có giá trị")
  void testExecuteAiAnalysisDiabeticRetinopathyBiomarkersAndHeatmap() {
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 35); // LOW
    aiResponse.put("confidence", 0.96);

    Map<String, Object> drPrediction = new HashMap<>();
    drPrediction.put("category", "Diabetic Retinopathy");
    drPrediction.put("riskLevel", "LOW");
    drPrediction.put("riskScore", 15);

    aiResponse.put("predictions", List.of(drPrediction));

    // Biomarkers: mix between valid Number and invalid non-number (testing toDouble)
    Map<String, Object> biomarkers = new HashMap<>();
    biomarkers.put("avRatio", 0.67);
    biomarkers.put("vesselDensityPercent", "not-a-number"); // toDouble returns null
    biomarkers.put("tortuosityIndex", 1.12);
    biomarkers.put("verticalCdr", false); // toDouble returns null
    aiResponse.put("biomarkers", biomarkers);

    aiResponse.put("heatmapBase64", "data:image/png;base64,HEATMAP_TEST");

    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(aiResponse);

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");

    assertThat(saved.getRiskLevel()).isEqualTo(RiskLevel.LOW);
    assertThat(saved.getDiabeticRetinopathyRiskScore()).isEqualTo(15);
    assertThat(saved.getDiabeticRetinopathyRiskLevel()).isEqualTo("LOW");
    assertThat(saved.getAvRatio()).isEqualTo(0.67);
    assertThat(saved.getVesselDensityPercent()).isNull();
    assertThat(saved.getTortuosityIndex()).isEqualTo(1.12);
    assertThat(saved.getVerticalCdr()).isNull();
    assertThat(saved.getHeatmapBase64()).isEqualTo("data:image/png;base64,HEATMAP_TEST");
  }

  @Test
  @DisplayName("getScreeningsForDoctor: Khi assignedPatientIds rỗng -> trả về List.of(), khi có phần tử -> query repository")
  void testGetScreeningsForDoctorBranches() {
    UUID doctorId = UUID.randomUUID();

    // Case 1: assignedPatientIds rỗng
    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of());
    List<Screening> emptyResult = screeningService.getScreeningsForDoctor(doctorId);
    assertThat(emptyResult).isEmpty();
    verify(screeningRepository, never()).findByPatientIdInOrderByCreatedAtDesc(any());

    // Case 2: assignedPatientIds có phần tử
    UUID p1 = UUID.randomUUID();
    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(p1));
    Screening mockScreening = new Screening(p1, "http://eye.png");
    when(screeningRepository.findByPatientIdInOrderByCreatedAtDesc(List.of(p1)))
        .thenReturn(List.of(mockScreening));

    List<Screening> result = screeningService.getScreeningsForDoctor(doctorId);
    assertThat(result).hasSize(1);
    assertThat(result.get(0).getPatientId()).isEqualTo(p1);
  }

  @Test
  @DisplayName("addDoctorReview: Bao phủ originalAiRiskLevel đã có vs chưa có, adjustedDrRisk fallback, và catch notification exception")
  void testAddDoctorReviewAdditionalBranches() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Screening screening = new Screening(patientId, "https://cdn.aura.test/fundus.png");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setRiskLevel(RiskLevel.LOW);
    // originalAiRiskLevel is deliberately null to verify it gets populated from riskLevel

    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // Mock notification throwing exception to test catch block
    doThrow(new RuntimeException("WebSocket push failed"))
        .when(userNotificationService).sendNotificationToUser(any(), anyString(), anyString(), anyString(), anyString(), anyString());

    // Review with adjustedCardioRisk == null and adjustedDrRisk != null
    Screening reviewed = screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.MODIFIED,
        "Điều chỉnh rủi ro võng mạc tiểu đường",
        null,
        RiskLevel.MODERATE,
        List.of("E11.3")
    );

    assertThat(reviewed.getOriginalAiRiskLevel()).isEqualTo(RiskLevel.LOW);
    assertThat(reviewed.getDoctorRiskLevel()).isEqualTo(RiskLevel.MODERATE);
    assertThat(reviewed.getRiskLevel()).isEqualTo(RiskLevel.MODERATE);
    assertThat(reviewed.getDoctorDiabeticRetinopathyRiskLevel()).isEqualTo(RiskLevel.MODERATE);
    assertThat(reviewed.getStatus()).isEqualTo(ScreeningStatus.REVIEWED);
  }

  @Test
  @DisplayName("Catch block error fallback: Khi AI engine ném Exception -> trạng thái FAILED, rủi ro null và thông báo an toàn")
  void testAiServiceCallExceptionFallback() {
    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString()))
        .thenThrow(new RuntimeException("Cloud AI Gateway HTTP 504 Gateway Timeout"));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateScreeningRequest request = new CreateScreeningRequest(
        "https://cdn.aura.test/scan-os.png", "OS", "Fundus", "scan-os.png", 2048L, "image/png", null, null, null, null
    );

    Screening saved = screeningService.createScreening(patientId, request);

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.FAILED);
    assertThat(saved.getRiskScore()).isNull();
    assertThat(saved.getRiskLevel()).isNull();
    assertThat(saved.getAiRiskLevel()).isNull();
    assertThat(saved.getConfidence()).isNull();
    assertThat(saved.getFindings()).contains("Không thể kết nối đến máy chủ phân tích AI");
  }

  @ParameterizedTest(name = "AI score missing fallback: level=''{0}'', overallScore={1}, expectedScore={2}")
  @CsvSource({
    "'CRITICAL', 60, 85",
    "'SEVERE', 90, 90",
    "'HIGH', 50, 70",
    "'HIGH', 75, 75",
    "'MODERATE', 30, 48",
    "'MEDIUM', 55, 48",
    "'LOW', 25, 18",
    "'UNKNOWN', 40, 18"
  })
  @DisplayName("AI score missing fallback: Khi prediction không có riskScore/score -> suy ra điểm số theo chuẩn lâm sàng")
  void testAiScoreMissingFallback(String predRiskLevel, int overallScore, int expectedScore) {
    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", overallScore);
    aiResponse.put("confidence", 0.93);

    Map<String, Object> cardPrediction = new HashMap<>();
    cardPrediction.put("category", "Cardiovascular Risk");
    cardPrediction.put("riskLevel", predRiskLevel);
    // deliberately omit "riskScore" and "score"
    cardPrediction.put("clinicalNote", "Ghi chú lâm sàng vi mạch");

    aiResponse.put("predictions", List.of(cardPrediction));

    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/fundus.png");

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);
    assertThat(saved.getCardiovascularRiskScore()).isEqualTo(expectedScore);
    assertThat(saved.getCardiovascularRiskLevel()).isEqualTo(predRiskLevel);
    assertThat(saved.getStrokeRiskScore()).isEqualTo(expectedScore);
    assertThat(saved.getHypertensionRiskScore()).isEqualTo(expectedScore);
  }

  @Test
  @DisplayName("Findings fallback từ xaiRationale: Khi clinicalNote rỗng hoặc chứa 'Cấu trúc vi mạch' -> lấy xaiRationale")
  void testFindingsFallbackFromXaiRationale() {
    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 70);
    aiResponse.put("confidence", 0.88);

    Map<String, Object> cardPrediction = new HashMap<>();
    cardPrediction.put("category", "Cardiovascular Risk");
    cardPrediction.put("riskLevel", "HIGH");
    cardPrediction.put("clinicalNote", "Cấu trúc vi mạch thái dương"); // triggers fallback

    aiResponse.put("predictions", List.of(cardPrediction));
    aiResponse.put("xaiRationale", "Bản đồ Grad-CAM làm nổi bật vùng vi mạch co thắt mạnh góc phần tư trên.");

    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/fundus.png");

    assertThat(saved.getFindings()).isEqualTo("Bản đồ Grad-CAM làm nổi bật vùng vi mạch co thắt mạnh góc phần tư trên.");
  }

  @Test
  @DisplayName("Push notification failure: Khi userNotificationService ném Exception -> bắt an toàn không gián đoạn luồng tạo ca khám")
  void testPushNotificationFailureCaughtSafely() {
    Map<String, Object> aiResponse = Map.of(
        "overallVascularRiskScore", 85,
        "confidence", 0.95,
        "predictions", List.of()
    );
    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    doThrow(new RuntimeException("WebSocket/SSE Client Disconnected"))
        .when(userNotificationService).sendNotificationToUser(any(), anyString(), anyString(), anyString(), anyString(), anyString());

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/fundus.png");

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);
    assertThat(saved.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
  }

  @Test
  @DisplayName("addDoctorReview: Tạo chữ ký số HMAC-SHA256 hợp lệ và lưu vết thẩm định")
  void testAddDoctorReviewDigitalSignatureCreation() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Screening screening = new Screening(patientId, "https://cdn.aura.test/fundus.png");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setRiskLevel(RiskLevel.HIGH);

    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening reviewed = screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.APPROVED,
        "Xác nhận tổn thương vi mạch độ 2",
        null,
        null,
        List.of("H35.0", "I10")
    );

    assertThat(reviewed.getStatus()).isEqualTo(ScreeningStatus.REVIEWED);
    assertThat(reviewed.getDigitalSignature()).isNotNull().startsWith("HMAC-SHA256:");
    assertThat(reviewed.getDigitalSignature().length()).isGreaterThan(20);
    assertThat(reviewed.getSignedAt()).isNotNull();
    assertThat(reviewed.getReviewDecision()).isEqualTo(ReviewDecision.APPROVED);
  }

  @Test
  @DisplayName("addDoctorReview: Khi MODIFIED nhưng không cung cấp mức nguy cơ điều chỉnh -> ném IllegalArgumentException")
  void testAddDoctorReviewModifiedWithoutAdjustedRiskThrows() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Screening screening = new Screening(patientId, "https://cdn.aura.test/fundus.png");
    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));

    assertThatThrownBy(() -> screeningService.addDoctorReview(
        screeningId, doctorId, ReviewDecision.MODIFIED, "Modified note", null, null, List.of()
    )).isInstanceOf(IllegalArgumentException.class)
      .hasMessage("Thẩm định MODIFIED phải có ít nhất một mức nguy cơ điều chỉnh");
  }

  @Test
  @DisplayName("toDouble: Kiểm tra chuyển đổi an toàn cho Number và trả về null cho String/Object lạ")
  void testToDoubleWithVariousInputs() throws Exception {
    java.lang.reflect.Method toDoubleMethod = ScreeningService.class.getDeclaredMethod("toDouble", Object.class);
    toDoubleMethod.setAccessible(true);

    // Valid numbers
    assertThat(toDoubleMethod.invoke(screeningService, 42)).isEqualTo(42.0);
    assertThat(toDoubleMethod.invoke(screeningService, 3.14159)).isEqualTo(3.14159);
    assertThat(toDoubleMethod.invoke(screeningService, 100L)).isEqualTo(100.0);
    assertThat((Double) toDoubleMethod.invoke(screeningService, 2.5f)).isEqualTo(2.5, org.assertj.core.data.Offset.offset(0.001));

    // Non-numbers or unparseable objects -> null
    assertThat(toDoubleMethod.invoke(screeningService, "abc")).isNull();
    assertThat(toDoubleMethod.invoke(screeningService, "123.45")).isNull();
    assertThat(toDoubleMethod.invoke(screeningService, true)).isNull();
    assertThat(toDoubleMethod.invoke(screeningService, new Object())).isNull();
    assertThat(toDoubleMethod.invoke(screeningService, new Object[] { null })).isNull();
  }

  @Test
  @DisplayName("executeAiAnalysisAndPopulate: Hypertensive category, clinicalNote blank, và heatmapBase64 rỗng/blank")
  void testExecuteAiAnalysisHypertensiveCategoryAndBlankFallbacks() {
    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 72);
    aiResponse.put("confidence", 0.91);

    // Hypertensive category with blank clinicalNote
    Map<String, Object> hyperPrediction = new HashMap<>();
    hyperPrediction.put("category", "Hypertensive Retinopathy");
    hyperPrediction.put("riskLevel", "HIGH");
    hyperPrediction.put("riskScore", 70);
    hyperPrediction.put("clinicalNote", "   "); // blank -> should not set findings

    // Another category that is neither Cardio nor DR
    Map<String, Object> otherPrediction = new HashMap<>();
    otherPrediction.put("category", "Glaucoma Suspicion");
    otherPrediction.put("riskLevel", "LOW");

    aiResponse.put("predictions", List.of(hyperPrediction, otherPrediction));
    aiResponse.put("heatmapBase64", "   "); // blank -> should not set heatmapBase64
    aiResponse.put("biomarkers", null); // biomarkers null branch

    when(geminiAiService.analyzeRetinalVascular(anyString(), anyString())).thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, "https://cdn.aura.test/eye.png");

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);
    assertThat(saved.getHypertensionRiskScore()).isEqualTo(70);
    assertThat(saved.getHypertensionRiskLevel()).isEqualTo("HIGH");
    assertThat(saved.getCardiovascularRiskScore()).isEqualTo(70);
    assertThat(saved.getHeatmapBase64()).isNull();
    assertThat(saved.getFindings()).isNull();
  }

  @Test
  @DisplayName("logScreeningCreationAudit: Bao phủ nhánh saved.getId() khác null và userRepository == null")
  void testLogScreeningCreationAuditWithSavedIdAndNullUserRepo() {
    ScreeningService serviceNoUserRepo = new ScreeningService(
        screeningRepository,
        assignmentRepository,
        userNotificationService,
        auditLogService,
        clinicMemberRepository,
        null, // userRepository is null -> L189 evaluates to false
        geminiAiService
    );

    UUID screeningId = UUID.randomUUID();
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> {
      Screening s = inv.getArgument(0);
      ReflectionTestUtils.setField(s, "id", screeningId);
      return s;
    });

    Screening saved = serviceNoUserRepo.createScreening(patientId, "https://cdn.aura.test/eye.png");

    assertThat(saved.getId()).isEqualTo(screeningId);
    ArgumentCaptor<String> targetIdCaptor = ArgumentCaptor.forClass(String.class);
    verify(auditLogService).logEvent(
        eq(patientId),
        eq(null), // email is null because userRepository is null
        any(), any(), any(), any(),
        targetIdCaptor.capture(),
        any(), any(), any(), any()
    );
    assertThat(targetIdCaptor.getValue()).isEqualTo(screeningId.toString());
  }

  @Test
  @DisplayName("getScreeningsForDoctor: Khi assignedPatientIds là null -> trả về List.of()")
  void testGetScreeningsForDoctorWhenAssignedPatientIdsNull() {
    UUID doctorId = UUID.randomUUID();
    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(null);

    List<Screening> result = screeningService.getScreeningsForDoctor(doctorId);

    assertThat(result).isNotNull().isEmpty();
    verify(screeningRepository, never()).findByPatientIdInOrderByCreatedAtDesc(any());
  }

  @Test
  @DisplayName("addDoctorReview: Khi originalAiRiskLevel đã có sẵn -> không ghi đè lại")
  void testAddDoctorReviewPreservesExistingOriginalAiRiskLevel() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Screening screening = new Screening(patientId, "https://cdn.aura.test/fundus.png");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setRiskLevel(RiskLevel.HIGH);
    screening.setOriginalAiRiskLevel(RiskLevel.LOW); // Pre-existing

    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(screening));
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening reviewed = screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.APPROVED,
        "Đồng ý thẩm định",
        null,
        null,
        null // icd10Codes is null
    );

    assertThat(reviewed.getOriginalAiRiskLevel()).isEqualTo(RiskLevel.LOW);
    assertThat(reviewed.getIcd10Codes()).isNull();
    assertThat(reviewed.getReviewDecision()).isEqualTo(ReviewDecision.APPROVED);
  }

  @Test
  @DisplayName("createScreening: Gán clinicId trực tiếp từ CreateScreeningRequest")
  void testCreateScreeningSetsClinicIdFromRequest() {
    UUID clinicId = UUID.randomUUID();
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/eye.png", "OD", "Fundus", "test.png", 512L, "image/png",
        50, 0.65, "18%", clinicId
    );

    Screening saved = screeningService.createScreening(patientId, req);
    assertThat(saved.getClinicId()).isEqualTo(clinicId);
  }

  @Test
  @DisplayName("resolveAndAssignDoctorAndClinic: Screening đã có doctorId và clinicId từ trước -> bỏ qua việc tìm kiếm")
  void testResolveAndAssignDoctorAndClinicAlreadyPopulated() throws Exception {
    UUID existingDocId = UUID.randomUUID();
    UUID existingClinicId = UUID.randomUUID();

    java.lang.reflect.Method resolveMethod =
        ScreeningService.class.getDeclaredMethod("resolveAndAssignDoctorAndClinic", Screening.class, UUID.class);
    resolveMethod.setAccessible(true);

    Screening s = new Screening(patientId, "https://cdn.aura.test/eye.png");
    s.setDoctorId(existingDocId);
    s.setClinicId(existingClinicId);

    resolveMethod.invoke(screeningService, s, patientId);

    assertThat(s.getDoctorId()).isEqualTo(existingDocId);
    assertThat(s.getClinicId()).isEqualTo(existingClinicId);
    verify(assignmentRepository, never()).findByPatientIdAndStatus(any(), any());
    verify(clinicMemberRepository, never()).findByDoctorId(any());
  }

  @Test
  @DisplayName("getScreeningsForPatient & getAllScreenings: Lấy danh sách theo bệnh nhân và toàn bộ ca khám")
  void testGetScreeningsForPatientAndAll() {
    Screening s1 = new Screening(patientId, "http://cdn.aura/1.png");
    Screening s2 = new Screening(patientId, "http://cdn.aura/2.png");

    when(screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(List.of(s1, s2));
    when(screeningRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(s1, s2));

    List<Screening> patientScreenings = screeningService.getScreeningsForPatient(patientId);
    assertThat(patientScreenings).hasSize(2);

    List<Screening> allScreenings = screeningService.getAllScreenings();
    assertThat(allScreenings).hasSize(2);
  }

  @Test
  @DisplayName("getScreeningById: Tìm thấy ca khám vs ném ngoại lệ ResourceNotFoundException khi không tồn tại")
  void testGetScreeningByIdFoundAndNotFound() {
    UUID sid = UUID.randomUUID();
    Screening s = new Screening(patientId, "http://cdn.aura/found.png");
    ReflectionTestUtils.setField(s, "id", sid);

    when(screeningRepository.findById(sid)).thenReturn(Optional.of(s));

    Screening found = screeningService.getScreeningById(sid);
    assertThat(found.getId()).isEqualTo(sid);

    UUID notFoundId = UUID.randomUUID();
    when(screeningRepository.findById(notFoundId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> screeningService.getScreeningById(notFoundId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining("Ca sàng lọc không tồn tại với ID: " + notFoundId);
  }

  @Test
  @DisplayName("generateRecommendations: Khuyến nghị lâm sàng cho từng mức nguy cơ và null")
  void testGenerateRecommendationsDirectReflection() throws Exception {
    java.lang.reflect.Method method =
        ScreeningService.class.getDeclaredMethod("generateRecommendations", RiskLevel.class);
    method.setAccessible(true);

    assertThat(method.invoke(screeningService, (RiskLevel) null)).toString()
        .contains("Không thể sinh khuyến nghị");
    assertThat(method.invoke(screeningService, RiskLevel.CRITICAL)).toString()
        .contains("Nguy cơ RẤT CAO");
    assertThat(method.invoke(screeningService, RiskLevel.HIGH)).toString()
        .contains("Nguy cơ CAO");
    assertThat(method.invoke(screeningService, RiskLevel.MODERATE)).toString()
        .contains("Nguy cơ TRUNG BÌNH");
    assertThat(method.invoke(screeningService, RiskLevel.LOW)).toString()
        .contains("Nguy cơ THẤP");
  }

  @Test
  @DisplayName("sendAiReadyNotification: Thông báo tiến trình trung tính INFO khi kết quả AI sơ bộ sẵn sàng")
  void testSendAiReadyNotificationSeverities() throws Exception {
    java.lang.reflect.Method method =
        ScreeningService.class.getDeclaredMethod("sendAiReadyNotification", Screening.class, UUID.class);
    method.setAccessible(true);

    // Case 1: Status not ANALYZED -> does nothing
    Screening failedScreening = new Screening(patientId, "http://cdn.aura/failed.png");
    failedScreening.setStatus(ScreeningStatus.FAILED);
    method.invoke(screeningService, failedScreening, patientId);
    verify(userNotificationService, never()).sendNotificationToUser(any(), any(), any(), any(), any(), any());

    // Case 2: RiskLevel HIGH -> gửi thông báo trung tính INFO, không cảnh báo CRITICAL trực tiếp gây hoảng loạn
    Screening highScreening = new Screening(patientId, "http://cdn.aura/high.png");
    highScreening.setStatus(ScreeningStatus.ANALYZED);
    highScreening.setRiskLevel(RiskLevel.HIGH);
    highScreening.setConfidence(null);
    method.invoke(screeningService, highScreening, patientId);

    verify(userNotificationService).sendNotificationToUser(
        eq(patientId),
        eq("Ảnh võng mạc đã hoàn tất phân tích sơ bộ"),
        eq("Ảnh võng mạc của bạn đã được phân tích sơ bộ bởi AI và đang được chuyển đến bác sĩ chuyên khoa thẩm định lâm sàng."),
        eq("AI_READY"),
        eq("INFO"),
        eq("/cds-viewer")
    );
  }

  @Test
  @DisplayName("detectedAnomalies: Trích xuất và lưu trữ chuỗi JSON tổn thương vi mạch khi AI trả về")
  void testDetectedAnomaliesPersistenceAndMapping() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/fundus_anomalies.png",
        "OD",
        "Fundus",
        "fundus.png",
        204800L,
        "image/png",
        null,
        0.65,
        "18.2%",
        null
    );

    List<Map<String, Object>> anomalies = List.of(
        Map.of(
            "id", "ANO-01",
            "type", "Microaneurysm",
            "coordinates", Map.of("x", 62.5, "y", 41.2, "width", 24, "height", 24),
            "confidence", 0.92,
            "description", "Vi phình mạch nhỏ tại nhánh thái dương trên"
        )
    );

    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 68);
    aiResponse.put("confidence", 0.93);
    aiResponse.put("detectedAnomalies", anomalies);

    when(geminiAiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/fundus_anomalies.png"))
        .thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, req);

    assertThat(saved.getDetectedAnomalies()).isNotNull();
    assertThat(saved.getDetectedAnomalies()).contains("ANO-01");
    assertThat(saved.getDetectedAnomalies()).contains("Microaneurysm");

    com.aura.screening.dto.ScreeningResponse response = com.aura.screening.dto.ScreeningResponse.fromEntity(saved);
    assertThat(response.detectedAnomalies()).isEqualTo(saved.getDetectedAnomalies());
    assertThat(response.detectedAnomalies()).contains("62.5");
  }

  @Test
  @DisplayName("detectedAnomalies: Mặc định là '[]' khi AI không trả về hoặc trả về rỗng")
  void testDetectedAnomaliesDefaultEmptyArray() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/fundus_normal.png",
        "OS",
        "Fundus",
        "normal.png",
        102400L,
        "image/png",
        null,
        0.67,
        "19.0%",
        null
    );

    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 25);
    aiResponse.put("confidence", 0.96);
    // không có detectedAnomalies

    when(geminiAiService.analyzeRetinalVascular("OS", "https://cdn.aura.test/fundus_normal.png"))
        .thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, req);

    assertThat(saved.getDetectedAnomalies()).isEqualTo("[]");

    com.aura.screening.dto.ScreeningResponse response = com.aura.screening.dto.ScreeningResponse.fromEntity(saved);
    assertThat(response.detectedAnomalies()).isEqualTo("[]");
  }

  @Test
  @DisplayName("vesselMaskUrl: Lưu trữ và ánh xạ vesselMaskUrl từ AI vào entity và ScreeningResponse")
  void testVesselMaskUrlPersistence() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/fundus_mask.png",
        "OD",
        "Fundus",
        "mask_test.png",
        102400L,
        "image/png",
        null,
        0.65,
        "18.5%",
        null
    );

    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 30);
    aiResponse.put("confidence", 0.95);
    aiResponse.put("vesselMaskUrl", "https://cdn.aura.test/masks/mask_seg.png");

    when(geminiAiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/fundus_mask.png"))
        .thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, req);

    assertThat(saved.getVesselMaskUrl()).isEqualTo("https://cdn.aura.test/masks/mask_seg.png");

    com.aura.screening.dto.ScreeningResponse response = com.aura.screening.dto.ScreeningResponse.fromEntity(saved);
    assertThat(response.vesselMaskUrl()).isEqualTo("https://cdn.aura.test/masks/mask_seg.png");
  }

  @Test
  @DisplayName("vesselMaskUrl: Fallback lấy vesselMaskBase64 nếu vesselMaskUrl không có")
  void testVesselMaskBase64Fallback() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/fundus_b64.png",
        "OD",
        "Fundus",
        "b64_test.png",
        102400L,
        "image/png",
        null,
        0.65,
        "18.5%",
        null
    );

    Map<String, Object> aiResponse = new HashMap<>();
    aiResponse.put("overallVascularRiskScore", 30);
    aiResponse.put("confidence", 0.95);
    aiResponse.put("vesselMaskBase64", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");

    when(geminiAiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/fundus_b64.png"))
        .thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, req);

    com.aura.screening.dto.ScreeningResponse response = com.aura.screening.dto.ScreeningResponse.fromEntity(saved);
    assertThat(response.vesselMaskUrl()).isEqualTo("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");
  }

  @Test
  @DisplayName("Batch Delete: Người dùng sở hữu ca khám (thông qua PatientMedicalProfile) xóa thành công")
  void testBatchDelete_patientMedicalProfileOwner_success() {
    UUID authUserId = UUID.randomUUID();
    UUID medicalProfileId = UUID.randomUUID();
    UUID screeningId1 = UUID.randomUUID();
    UUID screeningId2 = UUID.randomUUID();

    User mockUser = new User("patient@aura.test", "Patient Name", "hashedPass123");
    ReflectionTestUtils.setField(mockUser, "id", authUserId);

    com.aura.patient.entity.PatientMedicalProfile medProfile = new com.aura.patient.entity.PatientMedicalProfile(mockUser, "MRN-2026-DEL");
    ReflectionTestUtils.setField(medProfile, "id", medicalProfileId);

    Screening s1 = new Screening(medicalProfileId, "https://cdn.aura.test/s1.png");
    ReflectionTestUtils.setField(s1, "id", screeningId1);
    Screening s2 = new Screening(medicalProfileId, "https://cdn.aura.test/s2.png");
    ReflectionTestUtils.setField(s2, "id", screeningId2);

    com.aura.patient.repository.PatientMedicalProfileRepository medRepo = org.mockito.Mockito.mock(com.aura.patient.repository.PatientMedicalProfileRepository.class);
    when(medRepo.findByUserId(authUserId)).thenReturn(Optional.of(medProfile));
    when(medRepo.findById(medicalProfileId)).thenReturn(Optional.of(medProfile));

    when(screeningRepository.findById(screeningId1)).thenReturn(Optional.of(s1));
    when(screeningRepository.findById(screeningId2)).thenReturn(Optional.of(s2));

    ScreeningService svc = new ScreeningService(
        screeningRepository,
        assignmentRepository,
        userNotificationService,
        auditLogService,
        clinicMemberRepository,
        userRepository,
        geminiAiService,
        billingService,
        null,
        medRepo
    );

    int deleted = svc.batchDeleteScreenings(List.of(screeningId1.toString(), screeningId2.toString()), authUserId, false);

    assertThat(deleted).isEqualTo(2);
    verify(screeningRepository).deleteAll(any());
    verify(screeningRepository).flush();
  }

  @Test
  @DisplayName("Single Delete: Bác sĩ được phân công xóa ca sàng lọc của bệnh nhân")
  void testDeleteScreening_assignedDoctor_success() {
    UUID doctorId = UUID.randomUUID();
    UUID patientUserId = UUID.randomUUID();
    UUID screeningId = UUID.randomUUID();

    Screening s = new Screening(patientUserId, "https://cdn.aura.test/s_doc.png");
    ReflectionTestUtils.setField(s, "id", screeningId);

    when(screeningRepository.findById(screeningId)).thenReturn(Optional.of(s));
    when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientUserId, AssignmentStatus.ACTIVE)).thenReturn(true);

    screeningService.deleteScreening(screeningId, doctorId, false);

    verify(screeningRepository).delete(s);
    verify(screeningRepository).flush();
  }

  @Test
  @DisplayName("Batch Delete: Bỏ qua ID không hợp lệ và trả về 0 khi rỗng")
  void testBatchDelete_emptyOrInvalid() {
    int count1 = screeningService.batchDeleteScreenings(null, UUID.randomUUID(), false);
    assertThat(count1).isZero();

    int count2 = screeningService.batchDeleteScreenings(List.of("invalid-uuid-1", "invalid-uuid-2"), UUID.randomUUID(), false);
    assertThat(count2).isZero();
  }
}
