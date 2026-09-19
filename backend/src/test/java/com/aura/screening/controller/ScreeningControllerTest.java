package com.aura.screening.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.service.PatientAccessService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.dto.ReviewScreeningRequest;
import com.aura.screening.dto.ScreeningResponse;
import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ScreeningControllerTest {

  @Mock
  private ScreeningService screeningService;

  @Mock
  private PatientAccessService patientAccessService;

  private ScreeningController controller;

  private AuraUserPrincipal patientPrincipal;
  private AuraUserPrincipal doctorPrincipal;
  private AuraUserPrincipal adminPrincipal;
  private UUID patientId;
  private UUID doctorId;
  private UUID adminId;

  @BeforeEach
  void setUp() {
    controller = new ScreeningController(screeningService, patientAccessService);
    patientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    adminId = UUID.randomUUID();
    patientPrincipal = new AuraUserPrincipal(patientId, "patient@aura.com", "pass", true, List.of("USER"));
    doctorPrincipal = new AuraUserPrincipal(doctorId, "doctor@aura.com", "pass", true, List.of("DOCTOR"));
    adminPrincipal = new AuraUserPrincipal(adminId, "admin@aura.com", "pass", true, List.of("ADMIN"));
  }

  @Test
  @DisplayName("FR-2: Patient tạo ca sàng lọc thành công")
  void createScreening_success() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "data:image/png;base64,sample", "OD", "FUNDUS", "eye.png", 1024L, "image/png", null, null, null, null
    );
    Screening screening = new Screening(patientId, req.imageUrl());

    when(screeningService.createScreening(eq(patientId), eq(req))).thenReturn(screening);

    ApiResponse<ScreeningResponse> response = controller.createScreening(patientPrincipal, req);

    assertNotNull(response);
    assertEquals(screening.getPatientId(), response.data().patientId());
    assertEquals(screening.getImageUrl(), response.data().imageUrl());
  }

  @Test
  @DisplayName("FR-6: Patient lấy danh sách ca sàng lọc của chính mình")
  void getScreenings_forPatient() {
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(patientPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("FR-15: Doctor thẩm định và duyệt ca sàng lọc")
  void reviewScreening_success() {
    UUID screeningId = UUID.randomUUID();
    ReviewScreeningRequest req = new ReviewScreeningRequest(
        ReviewDecision.APPROVED,
        "Đồng ý với AI",
        null,
        null,
        List.of("H35.0")
    );
    Screening screening = new Screening(patientId, "img1");

    when(screeningService.addDoctorReview(
        eq(screeningId),
        eq(doctorId),
        eq(req.decision()),
        eq(req.doctorNotes()),
        eq(req.adjustedCardioRisk()),
        eq(req.adjustedDrRisk()),
        eq(req.icd10Codes())
    )).thenReturn(screening);

    ApiResponse<ScreeningResponse> response = controller.reviewScreening(doctorPrincipal, screeningId, req);

    assertNotNull(response);
    assertEquals(patientId, response.data().patientId());
  }

  @Test
  @DisplayName("BE-CONS-2: Clinic lấy danh sách ca sàng lọc của phòng khám mình")
  void getScreenings_forClinic() {
    UUID clinicId = UUID.randomUUID();
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(clinicId, "clinic@aura.com", "pass", true, List.of("ROLE_CLINIC"));
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getScreeningsForClinic(clinicId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(clinicPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("FR-6: Patient yêu cầu danh sách với patientId của chính mình -> thành công")
  void getScreenings_withOwnPatientId_success() {
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(patientId, patientPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("FR-6 (IDOR): Patient cố tình xem sàng lọc của bệnh nhân khác -> chặn ACCESS_DENIED")
  void getScreenings_withOtherPatientId_throwsAccessDenied() {
    UUID otherPatientId = UUID.randomUUID();

    AuthException ex = assertThrows(AuthException.class, () ->
        controller.getScreenings(otherPatientId, patientPrincipal));

    assertEquals(ErrorCode.ACCESS_DENIED, ex.code());
  }

  @Test
  @DisplayName("FR-18: Doctor lấy danh sách sàng lọc theo patientId được phân công -> thành công")
  void getScreenings_byDoctorWithAssignedPatientId_success() {
    Screening s1 = new Screening(patientId, "img1");
    when(patientAccessService.canAccessPatient(doctorPrincipal, patientId)).thenReturn(true);
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(patientId, doctorPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("Security (IDOR): Doctor lấy danh sách sàng lọc theo patientId không được phân công -> chặn ACCESS_DENIED")
  void getScreenings_byDoctorWithUnassignedPatientId_throwsAccessDenied() {
    when(patientAccessService.canAccessPatient(doctorPrincipal, patientId)).thenReturn(false);

    AuthException ex = assertThrows(AuthException.class, () ->
        controller.getScreenings(patientId, doctorPrincipal));

    assertEquals(ErrorCode.ACCESS_DENIED, ex.code());
    assertEquals("Bác sĩ không có quyền truy cập lịch sử của bệnh nhân chưa được phân công", ex.getMessage());
  }

  @Test
  @DisplayName("FR-6/FR-7: Đảm bảo các trường camelCase được tuần tự hóa đầy đủ sang JSON")
  void screeningSerialization_containsAllRequiredCamelCaseFields() throws Exception {
    Screening s = new Screening(patientId, "https://example.com/fundus.png");
    ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(s, "createdAt", Instant.parse("2026-09-13T10:00:00Z"));
    s.setRiskScore(72);
    s.setEyePosition("OD");
    s.setScanType("Fundus_Macula");
    s.setIcd10Codes("H35.0\nI10");
    s.setDoctorNotes("Ghi chú lâm sàng của bác sĩ");
    s.setDigitalSignature("HMAC-SHA256:signature123");
    s.setSignedAt(Instant.parse("2026-09-13T10:30:00Z"));

    ObjectMapper mapper = new ObjectMapper()
        .findAndRegisterModules()
        .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    String json = mapper.writeValueAsString(s);
    JsonNode node = mapper.readTree(json);

    assertTrue(node.has("riskScore"), "Thiếu trường riskScore");
    assertEquals(72, node.get("riskScore").asInt());

    assertTrue(node.has("eyePosition"), "Thiếu trường eyePosition");
    assertEquals("OD", node.get("eyePosition").asText());

    assertTrue(node.has("scanType"), "Thiếu trường scanType");
    assertEquals("Fundus_Macula", node.get("scanType").asText());

    assertTrue(node.has("icd10Codes"), "Thiếu trường icd10Codes");
    assertEquals("H35.0\nI10", node.get("icd10Codes").asText());

    assertTrue(node.has("doctorNotes"), "Thiếu trường doctorNotes");
    assertEquals("Ghi chú lâm sàng của bác sĩ", node.get("doctorNotes").asText());

    assertTrue(node.has("digitalSignature"), "Thiếu trường digitalSignature");
    assertEquals("HMAC-SHA256:signature123", node.get("digitalSignature").asText());

    assertTrue(node.has("signedAt"), "Thiếu trường signedAt");
    assertEquals("2026-09-13T10:30:00Z", node.get("signedAt").asText());

    assertTrue(node.has("createdAt"), "Thiếu trường createdAt");
    assertEquals("2026-09-13T10:00:00Z", node.get("createdAt").asText());
  }

  @Test
  @DisplayName("FR-6: Lấy chi tiết ca sàng lọc theo ID thành công")
  void getScreeningById_success() {
    UUID screeningId = UUID.randomUUID();
    Screening screening = new Screening(patientId, "https://cdn.aura.com/detail.png");
    ReflectionTestUtils.setField(screening, "id", screeningId);
    when(screeningService.getScreeningById(screeningId)).thenReturn(screening);

    ApiResponse<ScreeningResponse> response = controller.getScreeningById(screeningId, patientPrincipal);

    assertNotNull(response);
    assertEquals(screeningId, response.data().id());
    assertEquals(patientId, response.data().patientId());
  }

  @Test
  @DisplayName("Security: Chưa đăng nhập khi lấy danh sách sàng lọc -> ném UNAUTHORIZED")
  void getScreenings_unauthenticated_throwsUnauthorized() {
    AuthException ex = assertThrows(AuthException.class, () ->
        controller.getScreenings(patientId, null));
    assertEquals(ErrorCode.UNAUTHORIZED, ex.code());
  }

  @Test
  @DisplayName("Security: Chưa đăng nhập khi tạo ca sàng lọc -> ném UNAUTHORIZED")
  void createScreening_unauthenticated_throwsUnauthorized() {
    CreateScreeningRequest req = new CreateScreeningRequest(
        "data:image/png;base64,sample", "OD", "FUNDUS", "eye.png", 1024L, "image/png", null, null, null, null
    );
    AuthException ex = assertThrows(AuthException.class, () ->
        controller.createScreening(null, req));
    assertEquals(ErrorCode.UNAUTHORIZED, ex.code());
  }

  @Test
  @DisplayName("Security: Chưa đăng nhập khi thẩm định ca sàng lọc -> ném UNAUTHORIZED")
  void reviewScreening_unauthenticated_throwsUnauthorized() {
    UUID screeningId = UUID.randomUUID();
    ReviewScreeningRequest req = new ReviewScreeningRequest(
        ReviewDecision.APPROVED, "Notes", null, null, List.of("H35.0")
    );
    AuthException ex = assertThrows(AuthException.class, () ->
        controller.reviewScreening(null, screeningId, req));
    assertEquals(ErrorCode.UNAUTHORIZED, ex.code());
  }

  @Test
  @DisplayName("FR-18/Security: Bác sĩ không truyền patientId -> chỉ lấy danh sách sàng lọc của bệnh nhân được phân công")
  void getScreenings_byDoctorWithoutPatientId_returnsDoctorAssignedScreenings() {
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getScreeningsForDoctor(doctorId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(null, doctorPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("Admin: Không truyền patientId -> xem toàn bộ danh sách sàng lọc của toàn viện")
  void getScreenings_byAdminWithoutPatientId_returnsAllScreenings() {
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getAllScreenings()).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(null, adminPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("Admin: Có truyền patientId -> xem danh sách sàng lọc của bệnh nhân cụ thể")
  void getScreenings_byAdminWithPatientId_returnsPatientScreenings() {
    Screening s1 = new Screening(patientId, "img1");
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(s1));

    ApiResponse<List<Screening>> response = controller.getScreenings(patientId, adminPrincipal);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("RBAC: Khi principal.roles() là null -> hasRole trả về false, fallback về quyền cá nhân của chính mình")
  void getScreenings_whenPrincipalRolesNull_fallbackToOwnHistory() {
    AuraUserPrincipal nullRolePrincipal = new AuraUserPrincipal(patientId, "norole@aura.test", "pass", true, null);
    Screening s = new Screening(patientId, "img_self");
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(s));

    // Case 1: patientId == null
    ApiResponse<List<Screening>> res1 = controller.getScreenings(null, nullRolePrincipal);
    assertNotNull(res1.data());
    assertEquals(1, res1.data().size());

    // Case 2: getScreenings(principal) overload
    ApiResponse<List<Screening>> res2 = controller.getScreenings(nullRolePrincipal);
    assertNotNull(res2.data());
    assertEquals(1, res2.data().size());

    // Case 3: patientId != null && patientId == principal.id()
    ApiResponse<List<Screening>> res3 = controller.getScreenings(patientId, nullRolePrincipal);
    assertNotNull(res3.data());
    assertEquals(1, res3.data().size());

    // Case 4: patientId != null && patientId != principal.id() -> ném AuthException ACCESS_DENIED
    UUID otherId = UUID.randomUUID();
    AuthException ex = assertThrows(AuthException.class, () -> controller.getScreenings(otherId, nullRolePrincipal));
    assertEquals(ErrorCode.ACCESS_DENIED, ex.code());
    assertTrue(ex.getMessage().contains("Không có quyền truy cập lịch sử sàng lọc của bệnh nhân khác"));
  }

  @Test
  @DisplayName("RBAC: createScreening và getScreening khi principal.roles() là null")
  void createAndGetScreening_whenPrincipalRolesNull_succeeds() {
    AuraUserPrincipal nullRolePrincipal = new AuraUserPrincipal(patientId, "norole@aura.test", "pass", true, null);

    CreateScreeningRequest req = new CreateScreeningRequest(
        "data:image/png;base64,sample", "OD", "FUNDUS", "eye.png", 1024L, "image/png", null, null, null, null
    );
    Screening screening = new Screening(patientId, req.imageUrl());
    when(screeningService.createScreening(eq(patientId), eq(req))).thenReturn(screening);

    ApiResponse<ScreeningResponse> res = controller.createScreening(nullRolePrincipal, req);
    assertNotNull(res);
    assertEquals(patientId, res.data().patientId());

    UUID screeningId = UUID.randomUUID();
    ReflectionTestUtils.setField(screening, "id", screeningId);
    when(screeningService.getScreeningById(screeningId)).thenReturn(screening);

    ApiResponse<ScreeningResponse> detailRes = controller.getScreening(screeningId, nullRolePrincipal);
    assertNotNull(detailRes);
    assertEquals(screeningId, detailRes.data().id());

    ApiResponse<ScreeningResponse> detailRes2 = controller.getScreeningById(screeningId, nullRolePrincipal);
    assertNotNull(detailRes2);
    assertEquals(screeningId, detailRes2.data().id());
  }

  @Test
  @DisplayName("DAT-04: fromEntitySummary omits raw Base64 and returns lightweight image endpoint")
  void fromEntitySummary_withBase64_omitsRawPayload() {
    UUID screeningId = UUID.randomUUID();
    Screening s = new Screening(patientId, "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...");
    ReflectionTestUtils.setField(s, "id", screeningId);
    s.setHeatmapBase64("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");

    ScreeningResponse summary = ScreeningResponse.fromEntitySummary(s);
    assertNotNull(summary);
    assertEquals("/api/v1/screenings/" + screeningId + "/image", summary.imageUrl());
    org.junit.jupiter.api.Assertions.assertNull(summary.heatmapBase64());

    // External URL should be preserved
    Screening sExt = new Screening(patientId, "https://cdn.aura.health/scans/fundus123.jpg");
    ReflectionTestUtils.setField(sExt, "id", screeningId);
    ScreeningResponse summaryExt = ScreeningResponse.fromEntitySummary(sExt);
    assertEquals("https://cdn.aura.health/scans/fundus123.jpg", summaryExt.imageUrl());
  }

  @Test
  @DisplayName("DAT-04: getScreeningImage serves binary bytes with cache headers")
  void getScreeningImage_servesBinaryBytes() {
    UUID screeningId = UUID.randomUUID();
    // 4-byte base64 png stub: "aGVsbG8="
    Screening s = new Screening(patientId, "data:image/png;base64,aGVsbG8=");
    ReflectionTestUtils.setField(s, "id", screeningId);
    when(screeningService.getScreeningById(screeningId)).thenReturn(s);

    org.springframework.http.ResponseEntity<?> response = controller.getScreeningImage(screeningId, patientPrincipal);
    assertNotNull(response);
    assertEquals(200, response.getStatusCode().value());
    assertEquals("image/png", response.getHeaders().getContentType().toString());
    assertNotNull(response.getHeaders().getCacheControl());
    assertTrue(response.getBody() instanceof byte[]);
  }

  @Test
  @DisplayName("DAT-04: getScreeningImage redirects external image URLs")
  void getScreeningImage_redirectsExternalUrl() {
    UUID screeningId = UUID.randomUUID();
    Screening s = new Screening(patientId, "https://cdn.aura.health/scans/1.jpg");
    ReflectionTestUtils.setField(s, "id", screeningId);
    when(screeningService.getScreeningById(screeningId)).thenReturn(s);

    org.springframework.http.ResponseEntity<?> response = controller.getScreeningImage(screeningId, patientPrincipal);
    assertNotNull(response);
    assertEquals(302, response.getStatusCode().value());
    assertEquals("https://cdn.aura.health/scans/1.jpg", response.getHeaders().getLocation().toString());
  }
}
