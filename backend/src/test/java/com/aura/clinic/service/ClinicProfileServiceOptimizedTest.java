package com.aura.clinic.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.clinic.dto.SubmitClinicProfileRequest;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.repository.ClinicProfileRepository;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClinicProfileService - Optimized Exception & Admin Update Tests")
class ClinicProfileServiceOptimizedTest {

  @Mock private ClinicProfileRepository clinicProfileRepository;
  @Mock private UserRepository userRepository;

  private ClinicProfileService service;
  private UUID clinicUserId;
  private UUID profileId;
  private User clinicUser;
  private ClinicProfile existingProfile;

  @BeforeEach
  void setUp() {
    service = new ClinicProfileService(clinicProfileRepository, userRepository);
    clinicUserId = UUID.randomUUID();
    profileId = UUID.randomUUID();

    clinicUser = new User("clinic.opt@aura.hospital", "hash", "Phòng Khám Đa Khoa AURA");
    ReflectionTestUtils.setField(clinicUser, "id", clinicUserId);

    existingProfile = new ClinicProfile(clinicUser, "Phòng Khám Gốc", "GPHD-12345", "https://docs.aura.ai/lic.pdf");
    ReflectionTestUtils.setField(existingProfile, "id", profileId);
  }

  @Test
  @DisplayName("getProfileByUserId: Ném ResourceNotFoundException với gợi ý FR-22 khi chưa nộp hồ sơ")
  void testGetProfileByUserIdNotFoundThrowsException() {
    when(clinicProfileRepository.findByUserId(clinicUserId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getProfileByUserId(clinicUserId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Phòng khám chưa nộp hồ sơ đăng ký tổ chức. Vui lòng hoàn tất FR-22 trước.");
  }

  @Test
  @DisplayName("getProfileByUserId: Trả về hồ sơ phòng khám khi userId tồn tại trong cơ sở dữ liệu")
  void testGetProfileByUserIdSuccess() {
    when(clinicProfileRepository.findByUserId(clinicUserId)).thenReturn(Optional.of(existingProfile));

    ClinicProfile result = service.getProfileByUserId(clinicUserId);

    assertThat(result).isNotNull();
    assertThat(result.getOrganizationName()).isEqualTo("Phòng Khám Gốc");
    assertThat(result.getLicenseNumber()).isEqualTo("GPHD-12345");
  }

  @Test
  @DisplayName("updateByAdmin: Ném ResourceNotFoundException khi không tìm thấy hồ sơ phòng khám theo profileId")
  void testUpdateByAdminNotFoundThrowsException() {
    UUID nonExistentProfileId = UUID.randomUUID();
    when(clinicProfileRepository.findById(nonExistentProfileId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.updateByAdmin(nonExistentProfileId, "New Name", "GPHD-999", "https://url.pdf"))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessage("Không tìm thấy hồ sơ phòng khám");

    verify(clinicProfileRepository, never()).save(any());
  }

  @Test
  @DisplayName("updateByAdmin: Cập nhật thành công với license và URL dạng rỗng/khoảng trắng được gán về null")
  void testUpdateByAdminWithBlankLicenseAndUrlSetsNull() {
    when(clinicProfileRepository.findById(profileId)).thenReturn(Optional.of(existingProfile));
    when(clinicProfileRepository.save(any(ClinicProfile.class))).thenAnswer(i -> i.getArgument(0));

    // organizationName blank -> không thay đổi tên cũ, license và url blank -> gán null
    ClinicProfile result = service.updateByAdmin(profileId, "   ", "   ", "   ");

    assertThat(result.getOrganizationName()).isEqualTo("Phòng Khám Gốc");
    assertThat(result.getLicenseNumber()).isNull();
    assertThat(result.getLicenseDocumentUrl()).isNull();
    verify(clinicProfileRepository).save(existingProfile);
  }

  @Test
  @DisplayName("updateByAdmin: Cập nhật thông tin tổ chức, giấy phép và đường dẫn tài liệu chuẩn xác")
  void testUpdateByAdminWithValidData() {
    when(clinicProfileRepository.findById(profileId)).thenReturn(Optional.of(existingProfile));
    when(clinicProfileRepository.save(any(ClinicProfile.class))).thenAnswer(i -> i.getArgument(0));

    ClinicProfile result = service.updateByAdmin(
        profileId, "  Phòng Khám Quốc Tế AURA  ", "  GPHD-99999  ", "  https://docs.aura.ai/new_lic.pdf  ");

    assertThat(result.getOrganizationName()).isEqualTo("Phòng Khám Quốc Tế AURA");
    assertThat(result.getLicenseNumber()).isEqualTo("GPHD-99999");
    assertThat(result.getLicenseDocumentUrl()).isEqualTo("https://docs.aura.ai/new_lic.pdf");
  }

  @Test
  @DisplayName("submitOrUpdateProfile: Ném ResourceNotFoundException khi tài khoản phòng khám không tồn tại")
  void testSubmitProfileUserNotFoundThrows() {
    when(userRepository.findById(clinicUserId)).thenReturn(Optional.empty());

    var request = new SubmitClinicProfileRequest("Tên", "GPHD", "https://url.pdf");
    assertThatThrownBy(() -> service.submitOrUpdateProfile(clinicUserId, request))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessage("Không tìm thấy tài khoản phòng khám");
  }

  @Test
  @DisplayName("review: Ném ResourceNotFoundException khi không tìm thấy hồ sơ phòng khám")
  void testReviewProfileNotFoundThrows() {
    when(clinicProfileRepository.findById(profileId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.review(profileId, true, null, UUID.randomUUID()))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessage("Không tìm thấy hồ sơ phòng khám");
  }
}
