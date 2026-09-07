package com.aura.clinic.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.aura.clinic.dto.SubmitClinicProfileRequest;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.repository.ClinicProfileRepository;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * FR-22: Đăng ký tài khoản tổ chức phòng khám & quy trình xác thực pháp nhân.
 */
@ExtendWith(MockitoExtension.class)
class ClinicProfileServiceTest {

  @Mock private ClinicProfileRepository clinicProfileRepository;
  @Mock private UserRepository userRepository;

  private ClinicProfileService service;

  private User clinicUser;
  private UUID clinicUserId;

  @BeforeEach
  void setUp() {
    service = new ClinicProfileService(clinicProfileRepository, userRepository);
    clinicUserId = UUID.randomUUID();
    clinicUser = new User("clinic@aura.test", "hash", "Phong Kham AURA");
  }

  @Test
  void submitOrUpdateProfile_whenNoExistingProfile_createsNewPendingProfile() {
    var request = new SubmitClinicProfileRequest("Phong Kham Da Khoa AURA", "GPHD-000123", "https://files/license.pdf");
    when(userRepository.findById(clinicUserId)).thenReturn(Optional.of(clinicUser));
    when(clinicProfileRepository.findByUserId(clinicUserId)).thenReturn(Optional.empty());
    when(clinicProfileRepository.save(any(ClinicProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    ClinicProfile result = service.submitOrUpdateProfile(clinicUserId, request);

    assertThat(result.getOrganizationName()).isEqualTo("Phong Kham Da Khoa AURA");
    assertThat(result.getLicenseNumber()).isEqualTo("GPHD-000123");
    assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
    verify(clinicProfileRepository).save(any(ClinicProfile.class));
  }

  @Test
  void submitOrUpdateProfile_whenClinicUserMissing_throws() {
    var request = new SubmitClinicProfileRequest("Phong Kham", null, null);
    when(userRepository.findById(clinicUserId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.submitOrUpdateProfile(clinicUserId, request))
        .isInstanceOf(ResourceNotFoundException.class);
    verify(clinicProfileRepository, never()).save(any());
  }

  @Test
  void submitOrUpdateProfile_whenReSubmittedAfterRejection_resetsToPending() {
    var request = new SubmitClinicProfileRequest("Phong Kham Da Khoa AURA", "GPHD-999", "https://files/new.pdf");
    ClinicProfile rejected = new ClinicProfile(clinicUser, "Ten Cu", "GPHD-000", "https://files/old.pdf");
    rejected.setVerificationStatus(VerificationStatus.REJECTED);
    rejected.setRejectionReason("Giấy phép không hợp lệ");

    when(userRepository.findById(clinicUserId)).thenReturn(Optional.of(clinicUser));
    when(clinicProfileRepository.findByUserId(clinicUserId)).thenReturn(Optional.of(rejected));
    when(clinicProfileRepository.save(any(ClinicProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    ClinicProfile result = service.submitOrUpdateProfile(clinicUserId, request);

    assertThat(result.getOrganizationName()).isEqualTo("Phong Kham Da Khoa AURA");
    assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
    assertThat(result.getRejectionReason()).isNull();
  }

  @Test
  void getProfileByUserId_whenMissing_throwsWithFr22Hint() {
    when(clinicProfileRepository.findByUserId(clinicUserId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getProfileByUserId(clinicUserId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("FR-22");
  }

  @Test
  void getProfilesByStatus_whenStatusNull_returnsAll() {
    when(clinicProfileRepository.findAll()).thenReturn(List.of(new ClinicProfile(clinicUser, "A", null, null)));

    List<ClinicProfile> result = service.getProfilesByStatus(null);

    assertThat(result).hasSize(1);
    verify(clinicProfileRepository, never()).findByVerificationStatus(any());
  }

  @Test
  void getProfilesByStatus_whenStatusGiven_filtersByStatus() {
    when(clinicProfileRepository.findByVerificationStatus(VerificationStatus.PENDING))
        .thenReturn(List.of(new ClinicProfile(clinicUser, "A", null, null)));

    List<ClinicProfile> result = service.getProfilesByStatus(VerificationStatus.PENDING);

    assertThat(result).hasSize(1);
    verify(clinicProfileRepository, never()).findAll();
  }

  @Test
  void review_whenApproved_setsApprovedAndClearsRejectionReason() {
    UUID profileId = UUID.randomUUID();
    UUID reviewerId = UUID.randomUUID();
    User reviewer = new User("admin@aura.test", "hash", "Quan Tri Vien");
    ClinicProfile profile = new ClinicProfile(clinicUser, "Phong Kham", "GPHD-1", "url");

    when(clinicProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(clinicProfileRepository.save(any(ClinicProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    ClinicProfile result = service.review(profileId, true, null, reviewerId);

    assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.APPROVED);
    assertThat(result.getRejectionReason()).isNull();
    assertThat(result.getReviewedAt()).isNotNull();
    assertThat(result.getReviewedBy()).isEqualTo(reviewer);
  }

  @Test
  void review_whenRejected_setsRejectedAndStoresReason() {
    UUID profileId = UUID.randomUUID();
    UUID reviewerId = UUID.randomUUID();
    ClinicProfile profile = new ClinicProfile(clinicUser, "Phong Kham", "GPHD-1", "url");

    when(clinicProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
    when(userRepository.findById(reviewerId)).thenReturn(Optional.empty());
    when(clinicProfileRepository.save(any(ClinicProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    ArgumentCaptor<ClinicProfile> captor = ArgumentCaptor.forClass(ClinicProfile.class);
    ClinicProfile result = service.review(profileId, false, "Thiếu giấy phép hoạt động", reviewerId);

    verify(clinicProfileRepository).save(captor.capture());
    assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
    assertThat(result.getRejectionReason()).isEqualTo("Thiếu giấy phép hoạt động");
  }

  @Test
  void review_whenProfileMissing_throws() {
    UUID profileId = UUID.randomUUID();
    UUID reviewerId = UUID.randomUUID();
    when(clinicProfileRepository.findById(profileId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.review(profileId, true, null, reviewerId))
        .isInstanceOf(ResourceNotFoundException.class);
  }
}
