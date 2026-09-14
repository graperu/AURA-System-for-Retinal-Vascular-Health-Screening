package com.aura.screening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.screening.entity.Screening;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ScreeningServiceTest {

  @Mock
  private ScreeningRepository screeningRepository;

  @Mock
  private com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository;

  @Mock
  private com.aura.notification.service.UserNotificationService userNotificationService;

  @Mock
  private GeminiRetinalAiService geminiAiService;

  private ScreeningService screeningService;

  @BeforeEach
  void setUp() {
    RestClient.Builder builder = RestClient.builder();
    screeningService = new ScreeningService(screeningRepository, assignmentRepository, userNotificationService, geminiAiService, builder);
  }

  @Test
  @DisplayName("P0-1: Khi AI microservice offline, ca khám phải chuyển sang FAILED, giữ nguyên ảnh và KHÔNG sinh risk/confidence giả")
  void createScreening_whenAiOffline_shouldSetStatusFailedAndNullRisk() {
    UUID patientId = UUID.randomUUID();
    String imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Screening result = screeningService.createScreening(patientId, imageUrl);

    assertNotNull(result);
    assertEquals(patientId, result.getPatientId());
    assertEquals(imageUrl, result.getImageUrl(), "Ảnh gốc phải được bảo toàn nguyên vẹn");
    assertEquals(ScreeningStatus.FAILED, result.getStatus(), "Trạng thái ca khám phải là FAILED khi AI offline");
    assertNull(result.getRiskScore(), "riskScore bắt buộc phải là null (không được sinh giả)");
    assertNull(result.getRiskLevel(), "RiskLevel bắt buộc phải là null (không được sinh giả HIGH/CRITICAL)");
    assertNull(result.getAiRiskLevel(), "AiRiskLevel bắt buộc phải là null");
    assertNull(result.getConfidence(), "Confidence bắt buộc phải là null (không được sinh giả 0.94)");
    assertNotNull(result.getFindings());

    verify(screeningRepository).save(any(Screening.class));
  }

  @Test
  @DisplayName("FR-15/FR-16: Thẩm định lưu kết quả bác sĩ, giữ kết quả AI gốc và tạo chữ ký")
  void addDoctorReview_shouldPreserveAiRiskAndSignReview() {
    UUID screeningId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Screening screening = new Screening(UUID.randomUUID(), "https://example.test/fundus.png");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setRiskLevel(RiskLevel.HIGH);
    when(screeningRepository.findById(screeningId)).thenReturn(java.util.Optional.of(screening));
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Screening result = screeningService.addDoctorReview(
        screeningId,
        doctorId,
        ReviewDecision.MODIFIED,
        "Điều chỉnh theo thăm khám trực tiếp",
        RiskLevel.MODERATE,
        RiskLevel.LOW,
        java.util.List.of("H35.0", "I10"));

    assertEquals(RiskLevel.HIGH, result.getOriginalAiRiskLevel());
    assertEquals(RiskLevel.MODERATE, result.getRiskLevel());
    assertEquals(ReviewDecision.MODIFIED, result.getReviewDecision());
    assertEquals("H35.0\nI10", result.getIcd10Codes());
    assertNotNull(result.getDigitalSignature());
    assertNotNull(result.getSignedAt());
  }

  @Test
  @DisplayName("FR-2/FR-3: AI phân tích thành công -> lưu đúng riskScore từ AI và bảo toàn metadata")
  void createScreening_withAiSuccess_shouldPersistAiRiskScoreAndMetadata() {
    UUID patientId = UUID.randomUUID();
    String imageUrl = "https://cdn.aura.com/retina.jpg";
    com.aura.screening.dto.CreateScreeningRequest request = new com.aura.screening.dto.CreateScreeningRequest(
        imageUrl,
        "OD",
        "Fundus_Macula",
        "retina.jpg",
        204800L,
        "image/jpeg",
        null, // riskScore ban đầu rỗng để AI tính toán
        0.62,
        "17.2%",
        null
    );

    java.util.Map<String, Object> aiResponse = new java.util.HashMap<>();
    aiResponse.put("overallVascularRiskScore", 72);
    aiResponse.put("confidence", 0.93);
    aiResponse.put("biomarkers", java.util.Map.of(
        "avRatio", 0.62,
        "vesselDensityPercent", 17.2,
        "tortuosityIndex", 1.15,
        "verticalCdr", 0.38
    ));
    aiResponse.put("predictions", java.util.List.of(
        java.util.Map.of(
            "category", "Cardiovascular Risk",
            "confidence", 0.72,
            "riskLevel", "HIGH",
            "clinicalNote", "Hẹp tiểu động mạch võng mạc cung thái dương"
        )
    ));

    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(aiResponse);
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Screening result = screeningService.createScreening(patientId, request);

    assertNotNull(result);
    assertEquals(72, result.getRiskScore(), "riskScore phải được gán chính xác từ AI");
    assertEquals(RiskLevel.HIGH, result.getRiskLevel(), "riskLevel phải là HIGH cho điểm 72");
    assertEquals("OD", result.getEyePosition(), "eyePosition phải được bảo toàn");
    assertEquals("Fundus_Macula", result.getScanType(), "scanType phải được bảo toàn");
    assertEquals("retina.jpg", result.getFileName(), "fileName phải được bảo toàn");
    assertEquals(204800L, result.getFileSize(), "fileSize phải được bảo toàn");
    assertEquals("image/jpeg", result.getMimeType(), "mimeType phải được bảo toàn");
    assertEquals(ScreeningStatus.ANALYZED, result.getStatus());
    verify(screeningRepository).save(any(Screening.class));
  }

  @Test
  @DisplayName("FR-6: Lấy lịch sử ca khám của bệnh nhân sắp xếp theo thời gian giảm dần")
  void getScreeningsForPatient_shouldOrderByCreatedAtDesc() {
    UUID patientId = UUID.randomUUID();
    Screening s1 = new Screening(patientId, "img1");
    Screening s2 = new Screening(patientId, "img2");
    when(screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId))
        .thenReturn(java.util.List.of(s1, s2));

    java.util.List<Screening> list = screeningService.getScreeningsForPatient(patientId);

    assertNotNull(list);
    assertEquals(2, list.size());
    verify(screeningRepository).findByPatientIdOrderByCreatedAtDesc(patientId);
  }

  @Test
  @DisplayName("Fail-safe: Khi AI engine ném exception, ca khám chuyển FAILED, riskScore = null, không mock data")
  void createScreening_withRequest_whenAiThrowsException_shouldSetStatusFailedAndNullRisk() {
    UUID patientId = UUID.randomUUID();
    com.aura.screening.dto.CreateScreeningRequest req = new com.aura.screening.dto.CreateScreeningRequest(
        "https://cdn.aura.com/scan.jpg", "OS", "Fundus", "scan.jpg", 1024L, "image/jpeg", null, null, null, null
    );

    when(geminiAiService.analyzeRetinalVascular(any(), any()))
        .thenThrow(new RuntimeException("Cloud AI connection timeout"));
    when(screeningRepository.save(any(Screening.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    Screening result = screeningService.createScreening(patientId, req);

    assertNotNull(result);
    assertEquals(ScreeningStatus.FAILED, result.getStatus());
    assertNull(result.getRiskScore(), "riskScore phải là null khi AI gặp sự cố");
    assertNull(result.getRiskLevel(), "riskLevel phải là null khi AI gặp sự cố");
    assertNull(result.getAiRiskLevel(), "aiRiskLevel phải là null khi AI gặp sự cố");
    assertNull(result.getConfidence(), "confidence phải là null khi AI gặp sự cố");
    assertNotNull(result.getFindings());
    assertTrue(result.getFindings().contains("Không thể kết nối đến máy chủ phân tích AI"));
    verify(screeningRepository).save(any(Screening.class));
  }

  @Test
  @DisplayName("FR-6/RBAC: Bác sĩ xem danh sách ca khám của các bệnh nhân được phân công, sắp xếp createdAt DESC")
  void getScreeningsForDoctor_whenDoctorHasAssignedPatients_shouldReturnScreeningsOrderedByCreatedAtDesc() {
    UUID doctorId = UUID.randomUUID();
    UUID patient1 = UUID.randomUUID();
    UUID patient2 = UUID.randomUUID();
    List<UUID> assignedPatientIds = List.of(patient1, patient2);

    Screening s1 = new Screening(patient1, "img1");
    Screening s2 = new Screening(patient2, "img2");

    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(
        doctorId, com.aura.doctor.entity.AssignmentStatus.ACTIVE))
        .thenReturn(assignedPatientIds);
    when(screeningRepository.findByPatientIdInOrderByCreatedAtDesc(assignedPatientIds))
        .thenReturn(List.of(s1, s2));

    List<Screening> list = screeningService.getScreeningsForDoctor(doctorId);

    assertNotNull(list);
    assertEquals(2, list.size());
    verify(assignmentRepository).findPatientIdsByDoctorIdAndStatus(
        doctorId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
    verify(screeningRepository).findByPatientIdInOrderByCreatedAtDesc(assignedPatientIds);
  }

  @Test
  @DisplayName("FR-6: Bác sĩ chưa có bệnh nhân nào được phân công -> trả về danh sách rỗng")
  void getScreeningsForDoctor_whenDoctorHasNoAssignedPatients_shouldReturnEmptyList() {
    UUID doctorId = UUID.randomUUID();

    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(
        doctorId, com.aura.doctor.entity.AssignmentStatus.ACTIVE))
        .thenReturn(List.of());

    List<Screening> list = screeningService.getScreeningsForDoctor(doctorId);

    assertNotNull(list);
    assertTrue(list.isEmpty());
    verify(screeningRepository, never()).findByPatientIdInOrderByCreatedAtDesc(any());
  }

  @Test
  @DisplayName("FR-6: Lấy toàn bộ ca khám sắp xếp theo createdAt DESC")
  void getAllScreenings_shouldOrderByCreatedAtDesc() {
    Screening s1 = new Screening(UUID.randomUUID(), "img1");
    Screening s2 = new Screening(UUID.randomUUID(), "img2");
    when(screeningRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(s1, s2));

    List<Screening> list = screeningService.getAllScreenings();

    assertNotNull(list);
    assertEquals(2, list.size());
    verify(screeningRepository).findAllByOrderByCreatedAtDesc();
  }

  @Test
  @DisplayName("FR-6: Tìm ca khám theo ID tồn tại -> thành công")
  void getScreeningById_whenFound_shouldReturnScreening() {
    UUID screeningId = UUID.randomUUID();
    Screening s = new Screening(UUID.randomUUID(), "img");
    ReflectionTestUtils.setField(s, "id", screeningId);
    when(screeningRepository.findById(screeningId)).thenReturn(java.util.Optional.of(s));

    Screening found = screeningService.getScreeningById(screeningId);

    assertNotNull(found);
    assertEquals(screeningId, found.getId());
  }

  @Test
  @DisplayName("FR-6: Tìm ca khám theo ID không tồn tại -> ném ResourceNotFoundException")
  void getScreeningById_whenNotFound_shouldThrowResourceNotFoundException() {
    UUID screeningId = UUID.randomUUID();
    when(screeningRepository.findById(screeningId)).thenReturn(java.util.Optional.empty());

    assertThrows(com.aura.common.exception.ResourceNotFoundException.class,
        () -> screeningService.getScreeningById(screeningId));
  }

  @Test
  @DisplayName("detectedAnomalies: Trích xuất tọa độ tổn thương vi mạch và ánh xạ sang ScreeningResponse")
  void createScreening_withDetectedAnomalies_shouldPersistAndMapToResponse() {
    UUID patientId = UUID.randomUUID();
    String imageUrl = "https://cdn.aura.test/fundus_anomalies.png";

    java.util.Map<String, Object> aiMap = new java.util.HashMap<>();
    aiMap.put("overallVascularRiskScore", 72);
    aiMap.put("confidence", 0.94);
    aiMap.put("detectedAnomalies", java.util.List.of(
        java.util.Map.of(
            "id", "ANO-01",
            "type", "Microaneurysm",
            "coordinates", java.util.Map.of("x", 62.5, "y", 41.2, "width", 24, "height", 24),
            "confidence", 0.92,
            "description", "Vi phình mạch nhỏ"
        )
    ));

    when(geminiAiService.analyzeRetinalVascular("OD", imageUrl)).thenReturn(aiMap);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, imageUrl);

    assertNotNull(saved.getDetectedAnomalies());
    assertTrue(saved.getDetectedAnomalies().contains("ANO-01"));
    assertTrue(saved.getDetectedAnomalies().contains("Microaneurysm"));

    com.aura.screening.dto.ScreeningResponse response = com.aura.screening.dto.ScreeningResponse.fromEntity(saved);
    assertNotNull(response.detectedAnomalies());
    assertEquals(saved.getDetectedAnomalies(), response.detectedAnomalies());
  }

  @Test
  @DisplayName("vesselMaskUrl: Lưu trữ đường dẫn mặt nạ phân đoạn mạch máu và ánh xạ sang ScreeningResponse")
  void createScreening_withVesselMask_shouldPersistAndMapToResponse() {
    UUID patientId = UUID.randomUUID();
    String imageUrl = "https://cdn.aura.test/fundus_vessel_mask.png";
    String maskUrl = "https://cdn.aura.test/masks/vessel_mask_01.png";

    java.util.Map<String, Object> aiMap = new java.util.HashMap<>();
    aiMap.put("overallVascularRiskScore", 35);
    aiMap.put("confidence", 0.95);
    aiMap.put("vesselMaskUrl", maskUrl);

    when(geminiAiService.analyzeRetinalVascular("OD", imageUrl)).thenReturn(aiMap);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    Screening saved = screeningService.createScreening(patientId, imageUrl);

    assertNotNull(saved.getVesselMaskUrl());
    assertEquals(maskUrl, saved.getVesselMaskUrl());

    com.aura.screening.dto.ScreeningResponse response = com.aura.screening.dto.ScreeningResponse.fromEntity(saved);
    assertNotNull(response.vesselMaskUrl());
    assertEquals(maskUrl, response.vesselMaskUrl());
  }
}
