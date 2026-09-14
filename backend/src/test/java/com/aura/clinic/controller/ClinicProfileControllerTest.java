package com.aura.clinic.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.UpdateClinicAdminRequest;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.clinic.dto.ClinicProfileResponse;
import com.aura.clinic.dto.ReviewClinicProfileRequest;
import com.aura.clinic.dto.SubmitClinicProfileRequest;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.service.ClinicProfileService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.user.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ClinicProfileControllerTest {

  @Mock
  private ClinicProfileService clinicProfileService;

  private ClinicProfileController controller;

  private UUID clinicUserId;
  private AuraUserPrincipal clinicPrincipal;
  private UUID adminUserId;
  private AuraUserPrincipal adminPrincipal;
  private User clinicUser;
  private ClinicProfile sampleProfile;
  private UUID profileId;

  @BeforeEach
  void setUp() {
    controller = new ClinicProfileController(clinicProfileService);

    clinicUserId = UUID.randomUUID();
    clinicPrincipal = new AuraUserPrincipal(clinicUserId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC"));

    adminUserId = UUID.randomUUID();
    adminPrincipal = new AuraUserPrincipal(adminUserId, "admin@aura.test", "secret", true, List.of("ROLE_ADMIN"));

    clinicUser = new User("clinic@aura.test", "hash", "Phòng Khám Mắt Kỹ Thuật Cao");
    ReflectionTestUtils.setField(clinicUser, "id", clinicUserId);

    profileId = UUID.randomUUID();
    sampleProfile = new ClinicProfile(clinicUser, "Phòng Khám Mắt Kỹ Thuật Cao", "GPHD-12345", "https://cdn.aura/license.pdf");
    ReflectionTestUtils.setField(sampleProfile, "id", profileId);
    ReflectionTestUtils.setField(sampleProfile, "verificationStatus", VerificationStatus.PENDING);
    ReflectionTestUtils.setField(sampleProfile, "submittedAt", Instant.now());
  }

  @Nested
  @DisplayName("POST /api/v1/clinic/profile - Nộp hoặc cập nhật hồ sơ phòng khám")
  class SubmitProfileTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném ngoại lệ AuthException 401 UNAUTHORIZED")
    void submitProfile_whenPrincipalNull_throwsAuthException() {
      SubmitClinicProfileRequest req = new SubmitClinicProfileRequest("PK Mới", "GPHD-999", "https://doc.pdf");

      assertThatThrownBy(() -> controller.submitProfile(null, req))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Nộp hồ sơ phòng khám -> trả về thông báo chờ duyệt và dữ liệu hồ sơ")
    void submitProfile_success() {
      SubmitClinicProfileRequest req = new SubmitClinicProfileRequest(
          "Phòng Khám Mắt Kỹ Thuật Cao", "GPHD-12345", "https://cdn.aura/license.pdf"
      );
      when(clinicProfileService.submitOrUpdateProfile(eq(clinicUserId), eq(req))).thenReturn(sampleProfile);

      ApiResponse<ClinicProfileResponse> response = controller.submitProfile(clinicPrincipal, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).contains("Đã nộp hồ sơ đăng ký tổ chức");
      assertThat(response.data()).isNotNull();
      assertThat(response.data().id()).isEqualTo(profileId);
      assertThat(response.data().organizationName()).isEqualTo("Phòng Khám Mắt Kỹ Thuật Cao");
      assertThat(response.data().verificationStatus()).isEqualTo("PENDING");
      verify(clinicProfileService).submitOrUpdateProfile(eq(clinicUserId), eq(req));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/clinic/profile - Lấy thông tin hồ sơ của phòng khám hiện tại")
  class GetMyProfileTests {

    @Test
    @DisplayName("Thất bại: Principal là null -> ném ngoại lệ AuthException 401 UNAUTHORIZED")
    void getMyProfile_whenPrincipalNull_throwsAuthException() {
      assertThatThrownBy(() -> controller.getMyProfile(null))
          .isInstanceOf(AuthException.class)
          .satisfies(ex -> assertThat(((AuthException) ex).code()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }

    @Test
    @DisplayName("Thành công: Lấy hồ sơ phòng khám của chính mình")
    void getMyProfile_success() {
      when(clinicProfileService.getProfileByUserId(eq(clinicUserId))).thenReturn(sampleProfile);

      ApiResponse<ClinicProfileResponse> response = controller.getMyProfile(clinicPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy hồ sơ phòng khám thành công");
      assertThat(response.data().organizationName()).isEqualTo("Phòng Khám Mắt Kỹ Thuật Cao");
      verify(clinicProfileService).getProfileByUserId(eq(clinicUserId));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/admin/clinics - Admin tra cứu danh sách phòng khám")
  class ListClinicsTests {

    @Test
    @DisplayName("Thành công: Lấy danh sách hồ sơ phòng khám theo trạng thái")
    void listClinics_withStatusFilter_success() {
      when(clinicProfileService.getProfilesByStatus(eq(VerificationStatus.PENDING)))
          .thenReturn(List.of(sampleProfile));

      ApiResponse<List<ClinicProfileResponse>> response = controller.listClinics(VerificationStatus.PENDING);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách hồ sơ phòng khám thành công");
      assertThat(response.data()).hasSize(1);
      assertThat(response.data().get(0).organizationName()).isEqualTo("Phòng Khám Mắt Kỹ Thuật Cao");
      verify(clinicProfileService).getProfilesByStatus(eq(VerificationStatus.PENDING));
    }

    @Test
    @DisplayName("Thành công: Lấy danh sách hồ sơ phòng khám không truyền filter trạng thái")
    void listClinics_nullStatus_success() {
      when(clinicProfileService.getProfilesByStatus(null)).thenReturn(List.of(sampleProfile));

      ApiResponse<List<ClinicProfileResponse>> response = controller.listClinics(null);

      assertThat(response).isNotNull();
      assertThat(response.data()).hasSize(1);
      verify(clinicProfileService).getProfilesByStatus(null);
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/admin/clinics/{clinicProfileId} - Admin chỉnh sửa thông tin phòng khám")
  class UpdateClinicByAdminTests {

    @Test
    @DisplayName("Thành công: Cập nhật thông tin phòng khám bởi quản trị viên")
    void updateClinicByAdmin_success() {
      UpdateClinicAdminRequest req = new UpdateClinicAdminRequest(
          "Phòng Khám Đa Khoa Quốc Tế", "GPHD-99999", "https://cdn.aura/updated.pdf"
      );
      ReflectionTestUtils.setField(sampleProfile, "organizationName", "Phòng Khám Đa Khoa Quốc Tế");
      ReflectionTestUtils.setField(sampleProfile, "licenseNumber", "GPHD-99999");
      when(clinicProfileService.updateByAdmin(
          eq(profileId), eq("Phòng Khám Đa Khoa Quốc Tế"), eq("GPHD-99999"), eq("https://cdn.aura/updated.pdf")))
          .thenReturn(sampleProfile);

      ApiResponse<ClinicProfileResponse> response = controller.updateClinicByAdmin(profileId, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã cập nhật hồ sơ phòng khám");
      assertThat(response.data().organizationName()).isEqualTo("Phòng Khám Đa Khoa Quốc Tế");
      verify(clinicProfileService).updateByAdmin(
          eq(profileId), eq("Phòng Khám Đa Khoa Quốc Tế"), eq("GPHD-99999"), eq("https://cdn.aura/updated.pdf"));
    }
  }

  @Nested
  @DisplayName("PATCH /api/v1/admin/clinics/{clinicProfileId}/verify - Admin phê duyệt hoặc từ chối phòng khám")
  class ReviewClinicTests {

    @Test
    @DisplayName("Thành công: Phê duyệt hồ sơ phòng khám (decision = APPROVED)")
    void reviewClinic_approved_success() {
      ReviewClinicProfileRequest req = new ReviewClinicProfileRequest("APPROVED", null);
      ReflectionTestUtils.setField(sampleProfile, "verificationStatus", VerificationStatus.APPROVED);
      ReflectionTestUtils.setField(sampleProfile, "reviewedAt", Instant.now());

      when(clinicProfileService.review(eq(profileId), eq(true), eq(null), eq(adminUserId)))
          .thenReturn(sampleProfile);

      ApiResponse<ClinicProfileResponse> response = controller.reviewClinic(adminPrincipal, profileId, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã phê duyệt hồ sơ phòng khám");
      assertThat(response.data().verificationStatus()).isEqualTo("APPROVED");
      verify(clinicProfileService).review(eq(profileId), eq(true), eq(null), eq(adminUserId));
    }

    @Test
    @DisplayName("Thành công: Từ chối hồ sơ phòng khám (decision = REJECTED)")
    void reviewClinic_rejected_success() {
      ReviewClinicProfileRequest req = new ReviewClinicProfileRequest("REJECTED", "Giấy phép hoạt động đã hết hiệu lực");
      ReflectionTestUtils.setField(sampleProfile, "verificationStatus", VerificationStatus.REJECTED);
      ReflectionTestUtils.setField(sampleProfile, "rejectionReason", "Giấy phép hoạt động đã hết hiệu lực");
      ReflectionTestUtils.setField(sampleProfile, "reviewedAt", Instant.now());

      when(clinicProfileService.review(eq(profileId), eq(false), eq("Giấy phép hoạt động đã hết hiệu lực"), eq(adminUserId)))
          .thenReturn(sampleProfile);

      ApiResponse<ClinicProfileResponse> response = controller.reviewClinic(adminPrincipal, profileId, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã từ chối hồ sơ phòng khám");
      assertThat(response.data().verificationStatus()).isEqualTo("REJECTED");
      assertThat(response.data().rejectionReason()).isEqualTo("Giấy phép hoạt động đã hết hiệu lực");
      verify(clinicProfileService).review(eq(profileId), eq(false), eq("Giấy phép hoạt động đã hết hiệu lực"), eq(adminUserId));
    }
  }
}
