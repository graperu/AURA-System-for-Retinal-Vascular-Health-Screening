package com.aura.patient.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.patient.dto.PatientLabDocumentResponse;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientLabDocument;
import com.aura.patient.service.PatientLabDocumentService;
import com.aura.patient.service.PatientProfileService;
import com.aura.user.entity.User;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PatientProfileControllerUnitTest {

  @Mock
  private PatientProfileService profileService;

  @Mock
  private PatientLabDocumentService labDocumentService;

  private PatientProfileController controller;

  private UUID userId;
  private AuraUserPrincipal userPrincipal;
  private PatientProfileResponse sampleProfile;

  @BeforeEach
  void setUp() {
    controller = new PatientProfileController(profileService, labDocumentService);

    userId = UUID.randomUUID();
    userPrincipal = new AuraUserPrincipal(userId, "patient@aura.test", "secret", true, List.of("ROLE_USER"));

    sampleProfile = new PatientProfileResponse(
        UUID.randomUUID(), userId, "MRN-12345", "Nguyễn Văn An", "patient@aura.test",
        LocalDate.of(1985, 5, 20), 41, "Male", "0912345678", "Hà Nội", "O+",
        120, 80, 5.5, false, null, null, false, false, false, false,
        null, null, "Người thân", "0987654321", null, null, "2026-09-13T12:00:00Z"
    );
  }

  @Nested
  @DisplayName("GET /api/v1/patient/profile - Lấy hồ sơ y tế bệnh nhân")
  class GetMyProfileTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401 UNAUTHORIZED")
    void getMyProfile_whenPrincipalNull_throwsAuthException() {
      assertThatThrownBy(() -> controller.getMyProfile(null))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Lấy hoặc khởi tạo hồ sơ của chính mình")
    void getMyProfile_success() {
      when(profileService.getOrCreateProfile(eq(userId))).thenReturn(sampleProfile);

      ApiResponse<PatientProfileResponse> response = controller.getMyProfile(userPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy thông tin hồ sơ y tế thành công");
      assertThat(response.data().mrn()).isEqualTo("MRN-12345");
      verify(profileService).getOrCreateProfile(eq(userId));
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/patient/profile - Cập nhật hồ sơ bệnh nhân")
  class UpdateMyProfileTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném AuthException 401 UNAUTHORIZED")
    void updateMyProfile_whenPrincipalNull_throwsAuthException() {
      UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
          "Nguyễn Văn An", LocalDate.of(1985, 5, 20), 41, "Male", "0912345678",
          "Hà Nội", "O+", 120, 80, 5.5, false, null, null, false, false, false, false,
          null, null, null, null
      );

      assertThatThrownBy(() -> controller.updateMyProfile(null, req))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Cập nhật thông tin cá nhân và tiền sử y tế")
    void updateMyProfile_success() {
      UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
          "Nguyễn Văn An", LocalDate.of(1985, 5, 20), 41, "Male", "0912345678",
          "Hà Nội", "O+", 120, 80, 5.5, false, null, null, false, false, false, false,
          null, null, null, null
      );
      when(profileService.updateProfile(eq(userId), eq(req))).thenReturn(sampleProfile);

      ApiResponse<PatientProfileResponse> response = controller.updateMyProfile(userPrincipal, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Cập nhật thông tin cá nhân và tiền sử y tế thành công");
      assertThat(response.data()).isEqualTo(sampleProfile);
      verify(profileService).updateProfile(eq(userId), eq(req));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/patient/profile/{patientId} - Tra cứu hồ sơ theo ID bệnh nhân")
  class GetPatientProfileByIdTests {

    @Test
    @DisplayName("Thành công: Tra cứu hồ sơ bệnh nhân theo ID")
    void getPatientProfileById_success() {
      UUID patientId = UUID.randomUUID();
      when(profileService.getProfileByPatientId(eq(patientId))).thenReturn(sampleProfile);

      ApiResponse<PatientProfileResponse> response = controller.getPatientProfileById(patientId, userPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Tra cứu thông tin hồ sơ bệnh nhân thành công");
      assertThat(response.data()).isEqualTo(sampleProfile);
      verify(profileService).getProfileByPatientId(eq(patientId));
    }
  }

  @Nested
  @DisplayName("Tài liệu xét nghiệm của bệnh nhân (Lab Documents)")
  class LabDocumentTests {

    @Test
    @DisplayName("GET /lab-documents - Lấy danh sách tài liệu xét nghiệm của chính mình")
    void getMyLabDocuments_success() {
      PatientLabDocumentResponse docDto = new PatientLabDocumentResponse(
          UUID.randomUUID(), "blood_test.pdf", "application/pdf", 2048L, Instant.now()
      );
      when(labDocumentService.list(eq(userId))).thenReturn(List.of(docDto));

      ApiResponse<List<PatientLabDocumentResponse>> response = controller.getMyLabDocuments(userPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.data()).hasSize(1);
      assertThat(response.data().get(0).fileName()).isEqualTo("blood_test.pdf");
      verify(labDocumentService).list(eq(userId));
    }

    @Test
    @DisplayName("POST /lab-documents - Tải lên tệp xét nghiệm mới")
    void uploadMyLabDocument_success() {
      MockMultipartFile file = new MockMultipartFile(
          "file", "hba1c_report.pdf", "application/pdf", "PDF DATA".getBytes(StandardCharsets.UTF_8)
      );
      PatientLabDocumentResponse docDto = new PatientLabDocumentResponse(
          UUID.randomUUID(), "hba1c_report.pdf", "application/pdf", 8L, Instant.now()
      );
      when(labDocumentService.upload(eq(userId), eq(file))).thenReturn(docDto);

      ApiResponse<PatientLabDocumentResponse> response = controller.uploadMyLabDocument(userPrincipal, file);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã đính kèm kết quả xét nghiệm");
      assertThat(response.data()).isEqualTo(docDto);
      verify(labDocumentService).upload(eq(userId), eq(file));
    }

    @Test
    @DisplayName("DELETE /lab-documents/{documentId} - Xóa tệp xét nghiệm")
    void deleteMyLabDocument_success() {
      UUID docId = UUID.randomUUID();

      ApiResponse<Void> response = controller.deleteMyLabDocument(userPrincipal, docId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã xóa tệp xét nghiệm");
      verify(labDocumentService).delete(eq(userId), eq(docId));
    }

    @Test
    @DisplayName("GET /{patientId}/lab-documents - Bác sĩ xem danh sách tệp xét nghiệm của bệnh nhân")
    void getPatientLabDocuments_success() {
      UUID patientId = UUID.randomUUID();
      PatientLabDocumentResponse docDto = new PatientLabDocumentResponse(
          UUID.randomUUID(), "retina_scan.pdf", "application/pdf", 4096L, Instant.now()
      );
      when(labDocumentService.list(eq(patientId))).thenReturn(List.of(docDto));

      ApiResponse<List<PatientLabDocumentResponse>> response = controller.getPatientLabDocuments(patientId);

      assertThat(response).isNotNull();
      assertThat(response.data()).hasSize(1);
      verify(labDocumentService).list(eq(patientId));
    }

    @Test
    @DisplayName("GET /{patientId}/lab-documents/{documentId}/content - Tải về tệp xét nghiệm")
    void downloadLabDocument_success() {
      UUID patientId = UUID.randomUUID();
      UUID docId = UUID.randomUUID();
      User patientUser = new User("patient@aura.test", "hash", "Nguyễn Văn An");
      ReflectionTestUtils.setField(patientUser, "id", patientId);

      byte[] content = "SAMPLE PDF CONTENT".getBytes(StandardCharsets.UTF_8);
      PatientLabDocument doc = new PatientLabDocument(patientUser, "report.pdf", "application/pdf", content);
      when(labDocumentService.getContent(eq(patientId), eq(docId))).thenReturn(doc);

      ResponseEntity<ByteArrayResource> response = controller.downloadLabDocument(patientId, docId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
      assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)).contains("filename*=UTF-8''report.pdf");
      assertThat(response.getBody()).isNotNull();
      assertThat(response.getBody().getByteArray()).isEqualTo(content);
      verify(labDocumentService).getContent(eq(patientId), eq(docId));
    }
  }
}
