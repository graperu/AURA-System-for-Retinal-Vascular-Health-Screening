package com.aura.doctor.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
@DisplayName("DoctorPatientController - Optimized Sorting Matrix & Filter Branch Tests")
class DoctorPatientControllerOptimizedTest {

  @Mock private DoctorPatientAssignmentService assignmentService;
  @Mock private PatientProfileService profileService;
  @Mock private ScreeningService screeningService;

  private DoctorPatientController controller;

  @BeforeEach
  void setUp() {
    controller = new DoctorPatientController(assignmentService, profileService, screeningService);
  }

  @ParameterizedTest(name = "Sort param \"{0}\" -> Expected property: {1}, Direction: {2}")
  @CsvSource(value = {
    "lastExamDate,asc | lastExamDate | ASC",
    "lastExamDate,desc | lastExamDate | DESC",
    "riskScore,asc | riskScore | ASC",
    "riskScore,desc | riskScore | DESC",
    "fullName,asc | fullName | ASC",
    "fullName,desc | fullName | DESC",
    "createdAt,asc | createdAt | ASC",
    "createdAt,desc | createdAt | DESC",
    "invalidSortField,asc | createdAt | DESC",
    "maliciousField,desc | createdAt | DESC",
    "null | createdAt | DESC",
    "'' | createdAt | DESC",
    "'   ' | createdAt | DESC",
    "riskScore | riskScore | DESC",
    "riskScore,xyzInvalidDir | riskScore | DESC"
  }, delimiter = '|', nullValues = {"null"})
  @DisplayName("getPatients: Kiểm tra toàn bộ ma trận sắp xếp hợp lệ và fallback an toàn")
  void testGetPatientsSortMatrix(String sortInput, String expectedProperty, String expectedDirection) {
    when(profileService.searchPatients(
            any(), any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
        .thenReturn(new PageImpl<>(Collections.emptyList()));

    AuraUserPrincipal principal = new AuraUserPrincipal(UUID.randomUUID(), "admin@aura.ai", "pass", true, List.of("ADMIN"));

    ApiResponse<?> response = controller.getPatients(
        "Nguyen", null, null, null, null, null, null, null, null, 0, 10, sortInput, principal);

    assertThat(response.success()).isTrue();

    ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
    verify(profileService).searchPatients(
        eq("Nguyen"), any(), any(), any(), any(), any(), any(), any(), any(), pageableCaptor.capture());

    Pageable pageable = pageableCaptor.getValue();
    Sort.Order order = pageable.getSort().getOrderFor(expectedProperty);
    assertThat(order)
        .as("Cột sắp xếp phải là " + expectedProperty)
        .isNotNull();
    assertThat(order.getDirection().name())
        .as("Hướng sắp xếp phải là " + expectedDirection)
        .isEqualTo(expectedDirection);
  }

  @Test
  @DisplayName("getPatients: Trả về danh sách phân công trực tiếp khi không truyền query filter")
  void testGetPatientsAssignedBranch() {
    UUID doctorId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(doctorId, "doctor@aura.ai", "pass", true, List.of("DOCTOR"));
    DoctorPatientSummaryResponse assignedSummary = mock(DoctorPatientSummaryResponse.class);

    when(assignmentService.getAssignedPatients(doctorId)).thenReturn(List.of(assignedSummary));

    ApiResponse<?> response = controller.getPatients(
        null, null, null, null, null, null, null, null, null, null, null, null, principal);

    assertThat(response.success()).isTrue();
    assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân được phân công thành công");
    assertThat(response.data()).isEqualTo(List.of(assignedSummary));
  }

  @Test
  @DisplayName("getPatients: Trả về trang rỗng an toàn khi bác sĩ không có phân công nào (Không lộ dữ liệu toàn viện)")
  void testGetPatientsDefaultPaginationWhenNoAssignments() {
    UUID doctorId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(doctorId, "doctor@aura.ai", "pass", true, List.of("DOCTOR"));

    when(assignmentService.getAssignedPatients(doctorId)).thenReturn(Collections.emptyList());

    ApiResponse<?> response = controller.getPatients(
        null, null, null, null, null, null, null, null, null, null, null, null, principal);

    assertThat(response.success()).isTrue();
    assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân được phân công thành công");
    verifyNoInteractions(profileService);
  }

  @Test
  @DisplayName("getPatients: Fallback sang phân trang mặc định khi principal là null")
  void testGetPatientsDefaultPaginationWhenPrincipalIsNull() {
    when(profileService.searchPatients(
            any(), any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
        .thenReturn(new PageImpl<>(Collections.emptyList()));

    ApiResponse<?> response = controller.getPatients(
        null, null, null, null, null, null, null, null, null, null, null, null, null);

    assertThat(response.success()).isTrue();
    assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân thành công");
  }

  @Test
  @DisplayName("getPatients: Lọc theo tiền sử bệnh lý (tiểu đường, tăng huyết áp, hút thuốc)")
  void testGetPatientsMedicalHistoryFilters() {
    when(profileService.searchPatients(
            any(), any(), any(), any(), eq(true), eq(true), eq(false), eq("Dr. Alex"), eq("REVIEWED"), any(Pageable.class)))
        .thenReturn(new PageImpl<>(Collections.emptyList()));

    ApiResponse<?> response = controller.getPatients(
        null, "High", 70, 100, true, true, false, "Dr. Alex", "REVIEWED", 0, 20, null, null);

    assertThat(response.success()).isTrue();
    verify(profileService).searchPatients(
        any(), eq("High"), eq(70), eq(100), eq(true), eq(true), eq(false), eq("Dr. Alex"), eq("REVIEWED"), any(Pageable.class));
  }

  @Test
  @DisplayName("DoctorPatientController: Các thao tác CRUD bệnh nhân và hồ sơ lâm sàng")
  void testPatientCrudAndScreeningOperations() {
    UUID patientId = UUID.randomUUID();
    com.aura.patient.entity.PatientProfile entity = new com.aura.patient.entity.PatientProfile();
    com.aura.patient.dto.PatientProfileDto dto = mock(com.aura.patient.dto.PatientProfileDto.class);

    // 1. createPatient
    when(profileService.createPatient(entity)).thenReturn(dto);
    ApiResponse<com.aura.patient.dto.PatientProfileDto> createRes = controller.createPatient(entity);
    assertThat(createRes.success()).isTrue();
    assertThat(createRes.data()).isEqualTo(dto);

    // 2. updatePatient
    when(profileService.updatePatient(patientId, entity)).thenReturn(dto);
    ApiResponse<com.aura.patient.dto.PatientProfileDto> updateRes = controller.updatePatient(patientId, entity);
    assertThat(updateRes.success()).isTrue();
    assertThat(updateRes.data()).isEqualTo(dto);

    // 3. getAssignedPatientProfile
    com.aura.patient.dto.PatientProfileResponse profileResp = mock(com.aura.patient.dto.PatientProfileResponse.class);
    when(profileService.getProfileByPatientId(patientId)).thenReturn(profileResp);
    ApiResponse<com.aura.patient.dto.PatientProfileResponse> getProfileRes = controller.getAssignedPatientProfile(patientId);
    assertThat(getProfileRes.success()).isTrue();
    assertThat(getProfileRes.data()).isEqualTo(profileResp);

    // 4. getAssignedPatientScreenings
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(Collections.emptyList());
    ApiResponse<List<Screening>> screeningsRes = controller.getAssignedPatientScreenings(patientId);
    assertThat(screeningsRes.success()).isTrue();

    // 5. createScreeningForAssignedPatient
    AuraUserPrincipal principal = new AuraUserPrincipal(UUID.randomUUID(), "doc@aura.ai", "pass", true, List.of("DOCTOR"));
    com.aura.screening.dto.CreateScreeningRequest screeningReq = mock(com.aura.screening.dto.CreateScreeningRequest.class);
    Screening screening = mock(Screening.class);
    when(screeningService.createScreening(patientId, screeningReq)).thenReturn(screening);

    ApiResponse<Screening> createScreeningRes = controller.createScreeningForAssignedPatient(principal, patientId, screeningReq);
    assertThat(createScreeningRes.success()).isTrue();

    // 6. createScreeningForAssignedPatient với principal null -> ném AuthException
    org.assertj.core.api.Assertions.assertThatThrownBy(() ->
        controller.createScreeningForAssignedPatient(null, patientId, screeningReq))
        .isInstanceOf(com.aura.auth.exception.AuthException.class)
        .hasMessageContaining("Yêu cầu đăng nhập tài khoản Bác sĩ");
  }

  @Test
  @DisplayName("getPatients: Gọi với filter không truyền page/size (mặc định page=0, size=10) và bác sĩ có danh sách phân công")
  void testGetPatientsFilterWithoutPageSizeForDoctor() {
    UUID doctorId = UUID.randomUUID();
    UUID assignedPatientId = UUID.randomUUID();
    AuraUserPrincipal docPrincipal = new AuraUserPrincipal(doctorId, "doc@aura.ai", "pass", true, List.of("DOCTOR"));

    DoctorPatientSummaryResponse summary = new DoctorPatientSummaryResponse(
        assignedPatientId, "MRN-1", "Alice", "alice@aura.ai", null, 40, "Female",
        null, null, 120, 80, 5.5, true, false, null, "LOW", 1, null, "ACTIVE"
    );
    when(assignmentService.getAssignedPatients(doctorId)).thenReturn(List.of(summary));

    when(profileService.searchPatients(
        eq("Alice"), eq("LOW"), any(), any(), eq(true), eq(false), eq(false), any(), any(), eq(List.of(assignedPatientId)), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(mock(PatientProfileDto.class))));

    ApiResponse<?> response = controller.getPatients(
        "Alice", "LOW", null, null, true, false, false, null, null, null, null, null, docPrincipal);

    assertThat(response.success()).isTrue();
    verify(profileService).searchPatients(
        eq("Alice"), eq("LOW"), any(), any(), eq(true), eq(false), eq(false), any(), any(), eq(List.of(assignedPatientId)), any(Pageable.class));
  }

  @Test
  @DisplayName("updatePatient: Chặn bác sĩ cập nhật hồ sơ bệnh nhân không được phân công (ACCESS_DENIED)")
  void testUpdatePatientUnauthorizedDoctor() {
    UUID doctorId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    AuraUserPrincipal doctorPrincipal = new AuraUserPrincipal(doctorId, "doc@aura.ai", "pass", true, List.of("DOCTOR"));

    when(assignmentService.getAssignedPatients(doctorId)).thenReturn(Collections.emptyList());

    com.aura.patient.entity.PatientProfile profile = new com.aura.patient.entity.PatientProfile();

    org.assertj.core.api.Assertions.assertThatThrownBy(() ->
        controller.updatePatient(patientId, profile, doctorPrincipal))
        .isInstanceOf(com.aura.auth.exception.AuthException.class)
        .hasMessageContaining("Bạn không có quyền cập nhật hồ sơ bệnh nhân này");
  }
}
