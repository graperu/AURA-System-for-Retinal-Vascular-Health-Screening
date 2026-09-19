package com.aura.doctor.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.mockito.ArgumentCaptor;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.PageResponse;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.dto.ScreeningResponse;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class DoctorPatientControllerUnitTest {

  @Mock
  private DoctorPatientAssignmentService assignmentService;

  @Mock
  private PatientProfileService profileService;

  @Mock
  private ScreeningService screeningService;

  private DoctorPatientController controller;

  private UUID doctorId;
  private AuraUserPrincipal doctorPrincipal;
  private UUID patientId;

  @BeforeEach
  void setUp() {
    controller = new DoctorPatientController(assignmentService, profileService, screeningService);

    doctorId = UUID.randomUUID();
    doctorPrincipal = new AuraUserPrincipal(doctorId, "doctor@aura.test", "secret", true, List.of("ROLE_DOCTOR"));
    patientId = UUID.randomUUID();
  }

  @Nested
  @DisplayName("GET /api/v1/doctor/patients - Danh sách bệnh nhân (Tìm kiếm, phân trang & phân công)")
  class GetPatientsTests {

    @Test
    @DisplayName("Có tham số tìm kiếm/phân trang: Gọi searchPatients với Pageable và bộ lọc")
    void getPatients_withFiltersAndPagination_returnsPageResponse() {
      PatientProfileDto dto = new PatientProfileDto(
          UUID.randomUUID(), patientId, "MRN-101", "Trần Thị B", 62, "FEMALE", "0901234567",
          "Hà Nội", 140, 90, 7.1, true, true, false, "2026-09-01", "BS. Minh",
          78, "HIGH", "PENDING_REVIEW", "Có xuất huyết vi mạch võng mạc", "blue",
          Instant.now(), Instant.now()
      );
      Page<PatientProfileDto> pageResult = new PageImpl<>(List.of(dto), PageRequest.of(0, 10), 1);
      when(profileService.searchPatients(
          eq("Trần"), eq("HIGH"), eq(50), eq(90), eq(true), eq(true), eq(false),
          eq("BS. Minh"), eq("PENDING_REVIEW"), any(Pageable.class)))
          .thenReturn(pageResult);

      ApiResponse<?> response = controller.getPatients(
          "Trần", "HIGH", 50, 90, true, true, false, "BS. Minh", "PENDING_REVIEW",
          0, 10, "riskScore,asc", doctorPrincipal
      );

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân thành công");
      assertThat(response.data()).isInstanceOf(PageResponse.class);
    }

    @Test
    @DisplayName("Không truyền tham số: Bác sĩ có danh sách phân công -> Trả về danh sách được phân công")
    void getPatients_whenDoctorHasAssignedPatients_returnsAssignedList() {
      DoctorPatientSummaryResponse assigned = new DoctorPatientSummaryResponse(
          patientId, "MRN-101", "Trần Thị B", "patient@test.com", LocalDate.of(1964, 5, 12),
          62, "FEMALE", "0901234567", "Hà Nội", 130, 85, 6.2, false, true,
          Instant.now(), "MODERATE", 2, Instant.now(), "ACTIVE"
      );
      when(assignmentService.getAssignedPatients(eq(doctorId))).thenReturn(List.of(assigned));

      ApiResponse<?> response = controller.getPatients(
          null, null, null, null, null, null, null, null, null,
          null, null, null, doctorPrincipal
      );

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân được phân công thành công");
      assertThat(response.data()).isEqualTo(List.of(assigned));
      verify(assignmentService).getAssignedPatients(eq(doctorId));
    }

    @Test
    @DisplayName("Không truyền tham số: Bác sĩ chưa có phân công -> Trả về danh sách rỗng, không fallback toàn viện (SEC-F04)")
    void getPatients_whenNoAssignedPatients_returnsEmptyPageWithoutFallback() {
      when(assignmentService.getAssignedPatients(eq(doctorId))).thenReturn(Collections.emptyList());

      ApiResponse<?> response = controller.getPatients(
          null, null, null, null, null, null, null, null, null,
          null, null, null, doctorPrincipal
      );

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân được phân công thành công");
      assertThat(response.data()).isEqualTo(List.of());
      verifyNoInteractions(profileService);
    }

    @Test
    @DisplayName("Không có principal: Fallback về danh sách mặc định")
    void getPatients_whenPrincipalNull_fallsBackToDefaultSearch() {
      Page<PatientProfileDto> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 100), 0);
      when(profileService.searchPatients(
          eq(null), eq(null), eq(null), eq(null), eq(null), eq(null), eq(null), eq(null), eq(null), any(Pageable.class)))
          .thenReturn(emptyPage);

      ApiResponse<?> response = controller.getPatients(
          null, null, null, null, null, null, null, null, null,
          null, null, null, null
      );

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách bệnh nhân thành công");
    }

    @Test
    @DisplayName("CON-05: Kích thước phân trang vượt quá giới hạn (?size=2000000) được tự động kẹp về MAX_PAGE_SIZE = 100")
    void getPatients_withExcessivePageSize_clampsToMaxPageSize() {
      AuraUserPrincipal adminPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "admin@aura.test", "secret", true, List.of("ROLE_ADMIN"));
      ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
      Page<PatientProfileDto> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 100), 0);
      when(profileService.searchPatients(any(), any(), any(), any(), any(), any(), any(), any(), any(), pageableCaptor.capture()))
          .thenReturn(emptyPage);

      ApiResponse<?> response = controller.getPatients(
          null, null, null, null, null, null, null, null, null,
          0, 2_000_000, null, adminPrincipal
      );

      assertThat(pageableCaptor.getValue()).isNotNull();
      assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(DoctorPatientController.MAX_PAGE_SIZE);
      assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(0);
      assertThat(response.data()).isInstanceOf(PageResponse.class);
      assertThat(((PageResponse<?>) response.data()).size()).isEqualTo(DoctorPatientController.MAX_PAGE_SIZE);
    }

    @Test
    @DisplayName("CON-05: Tham số trang âm hoặc size <= 0 được tự động kẹp về giá trị an toàn")
    void getPatients_withNegativePageAndSize_clampsSafely() {
      AuraUserPrincipal adminPrincipal = new AuraUserPrincipal(UUID.randomUUID(), "admin@aura.test", "secret", true, List.of("ROLE_ADMIN"));
      ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
      Page<PatientProfileDto> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 1), 0);
      when(profileService.searchPatients(any(), any(), any(), any(), any(), any(), any(), any(), any(), pageableCaptor.capture()))
          .thenReturn(emptyPage);

      ApiResponse<?> response = controller.getPatients(
          null, null, null, null, null, null, null, null, null,
          -5, -100, null, adminPrincipal
      );

      assertThat(pageableCaptor.getValue()).isNotNull();
      assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(0);
      assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(1);
      assertThat(response.data()).isInstanceOf(PageResponse.class);
      assertThat(((PageResponse<?>) response.data()).page()).isEqualTo(0);
      assertThat(((PageResponse<?>) response.data()).size()).isEqualTo(1);
    }
  }

  @Nested
  @DisplayName("POST /api/v1/doctor/patients - Tạo hồ sơ bệnh nhân")
  class CreatePatientTests {

    @Test
    @DisplayName("Thành công: Tạo hồ sơ bệnh nhân mới")
    void createPatient_success() {
      PatientProfile patient = new PatientProfile("MRN-999", "Lê Văn C", 40, "MALE", "0912345678");
      PatientProfileDto createdDto = new PatientProfileDto(
          UUID.randomUUID(), UUID.randomUUID(), "MRN-999", "Lê Văn C", 40, "MALE", "0912345678",
          null, null, null, null, false, false, false, null, null,
          null, null, "UNVERIFIED", null, "gray", Instant.now(), Instant.now()
      );
      when(profileService.createPatient(eq(patient))).thenReturn(createdDto);

      ApiResponse<PatientProfileDto> response = controller.createPatient(patient);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Tạo hồ sơ bệnh nhân mới thành công");
      assertThat(response.data().mrn()).isEqualTo("MRN-999");
      verify(profileService).createPatient(eq(patient));
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/doctor/patients/{id} - Cập nhật hồ sơ bệnh nhân")
  class UpdatePatientTests {

    @Test
    @DisplayName("Thành công: Cập nhật hồ sơ bệnh nhân")
    void updatePatient_success() {
      UUID id = UUID.randomUUID();
      PatientProfile updateData = new PatientProfile("MRN-999", "Lê Văn C Đã Sửa", 41, "MALE", "0912345678");
      PatientProfileDto updatedDto = new PatientProfileDto(
          id, UUID.randomUUID(), "MRN-999", "Lê Văn C Đã Sửa", 41, "MALE", "0912345678",
          null, null, null, null, false, false, false, null, null,
          null, null, "UNVERIFIED", null, "gray", Instant.now(), Instant.now()
      );
      when(profileService.updatePatient(eq(id), eq(updateData))).thenReturn(updatedDto);

      ApiResponse<PatientProfileDto> response = controller.updatePatient(id, updateData);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Cập nhật hồ sơ bệnh nhân thành công");
      assertThat(response.data().fullName()).isEqualTo("Lê Văn C Đã Sửa");
      verify(profileService).updatePatient(eq(id), eq(updateData));
    }
  }

  @Nested
  @DisplayName("DELETE /api/v1/doctor/patients/{id} - Xóa hồ sơ bệnh nhân")
  class DeletePatientTests {

    @Test
    @DisplayName("Thành công: Xóa hồ sơ bệnh nhân")
    void deletePatient_success() {
      UUID id = UUID.randomUUID();

      ApiResponse<Void> response = controller.deletePatient(id);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Xóa hồ sơ bệnh nhân thành công");
      verify(profileService).deletePatient(eq(id));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/doctor/patients/batch-delete - Xóa hàng loạt hồ sơ bệnh nhân")
  class BatchDeletePatientsTests {

    @Test
    @DisplayName("Thành công: Xóa danh sách bệnh nhân đã chọn")
    void batchDeletePatients_success() {
      List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID());
      DoctorPatientController.BatchDeletePatientRequest req = new DoctorPatientController.BatchDeletePatientRequest(ids);
      when(profileService.batchDeletePatients(eq(ids))).thenReturn(2);

      ApiResponse<Integer> response = controller.batchDeletePatients(req, null);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Xóa thành công 2 hồ sơ bệnh nhân");
      assertThat(response.data()).isEqualTo(2);
      verify(profileService).batchDeletePatients(eq(ids));
    }

    @Test
    @DisplayName("Rỗng: Request rỗng hoặc null -> Trả về 0")
    void batchDeletePatients_whenEmpty_returnsZero() {
      DoctorPatientController.BatchDeletePatientRequest req = new DoctorPatientController.BatchDeletePatientRequest(List.of());

      ApiResponse<Integer> response = controller.batchDeletePatients(req, null);

      assertThat(response).isNotNull();
      assertThat(response.data()).isEqualTo(0);
      verifyNoInteractions(profileService);
    }
  }

  @Nested
  @DisplayName("GET /api/v1/doctor/patients/{patientId} - Chi tiết hồ sơ bệnh nhân (FR-13)")
  class GetPatientDetailsTests {

    @Test
    @DisplayName("Thành công: Lấy thông tin chi tiết hồ sơ bệnh nhân")
    void getAssignedPatientProfile_success() {
      PatientProfileResponse profileResponse = new PatientProfileResponse(
          patientId, doctorId, "MRN-001", "Nguyễn Văn A", "a@test.com", LocalDate.of(1980, 1, 1),
          46, "MALE", "0900000001", "Hà Nội", "O+", 120, 80, 5.8, false,
          null, null, false, false, false, false, null, null,
          null, null, "BS. Minh", doctorId, "2026-09-13T10:00:00Z"
      );
      when(profileService.getProfileByPatientId(eq(patientId))).thenReturn(profileResponse);

      ApiResponse<PatientProfileResponse> response = controller.getAssignedPatientProfile(patientId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy thông tin hồ sơ bệnh nhân thành công");
      assertThat(response.data().fullName()).isEqualTo("Nguyễn Văn A");
      verify(profileService).getProfileByPatientId(eq(patientId));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/doctor/patients/{patientId}/screenings - Lịch sử ca sàng lọc của bệnh nhân")
  class GetPatientScreeningsTests {

    @Test
    @DisplayName("Thành công: Lấy danh sách các ca sàng lọc của bệnh nhân")
    void getAssignedPatientScreenings_success() {
      Screening screening = new Screening(patientId, "https://cdn.aura/screening1.png");
      when(screeningService.getScreeningsForPatient(eq(patientId))).thenReturn(List.of(screening));

      ApiResponse<List<ScreeningResponse>> response = controller.getAssignedPatientScreenings(patientId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy lịch sử ca sàng lọc của bệnh nhân thành công");
      assertThat(response.data()).hasSize(1);
      assertThat(response.data().get(0).patientId()).isEqualTo(patientId);
      verify(screeningService).getScreeningsForPatient(eq(patientId));
    }
  }

  @Nested
  @DisplayName("POST /api/v1/doctor/patients/{patientId}/screenings - Tạo ca sàng lọc cho bệnh nhân")
  class CreateScreeningForPatientTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> Ném AuthException 401 UNAUTHORIZED")
    void createScreening_whenPrincipalNull_throwsAuthException() {
      CreateScreeningRequest req = new CreateScreeningRequest(
          "https://cdn.aura/scan.png", "OD", "COLOR_FUNDUS", "scan.png", 1024L, "image/png", 65, 0.65, "18.5", null
      );

      assertThatThrownBy(() -> controller.createScreeningForAssignedPatient(null, patientId, req))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Bác sĩ tạo ca sàng lọc cho bệnh nhân")
    void createScreening_success() {
      CreateScreeningRequest req = new CreateScreeningRequest(
          "https://cdn.aura/scan.png", "OD", "COLOR_FUNDUS", "scan.png", 1024L, "image/png", 65, 0.65, "18.5", null
      );
      Screening screening = new Screening(patientId, "https://cdn.aura/scan.png");
      when(screeningService.createScreening(eq(patientId), eq(req), eq(doctorId))).thenReturn(screening);

      ApiResponse<ScreeningResponse> response = controller.createScreeningForAssignedPatient(doctorPrincipal, patientId, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Tạo ca sàng lọc cho bệnh nhân được phân công thành công");
      assertThat(response.data().patientId()).isEqualTo(patientId);
      verify(screeningService).createScreening(eq(patientId), eq(req), eq(doctorId));
    }
  }
}
