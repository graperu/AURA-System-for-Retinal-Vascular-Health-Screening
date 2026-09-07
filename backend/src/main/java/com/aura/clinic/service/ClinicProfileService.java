package com.aura.clinic.service;

import com.aura.clinic.dto.SubmitClinicProfileRequest;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.repository.ClinicProfileRepository;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-22: Đăng ký tài khoản tổ chức phòng khám & quy trình xác thực pháp nhân. */
@Service
public class ClinicProfileService {

  private final ClinicProfileRepository clinicProfileRepository;
  private final UserRepository userRepository;

  public ClinicProfileService(ClinicProfileRepository clinicProfileRepository, UserRepository userRepository) {
    this.clinicProfileRepository = clinicProfileRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public ClinicProfile submitOrUpdateProfile(UUID clinicUserId, SubmitClinicProfileRequest request) {
    User clinicUser = userRepository
        .findById(clinicUserId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản phòng khám"));

    ClinicProfile profile = clinicProfileRepository.findByUserId(clinicUserId).orElse(null);
    if (profile == null) {
      profile = new ClinicProfile(
          clinicUser, request.organizationName(), request.licenseNumber(), request.licenseDocumentUrl());
    } else {
      // Chỉnh sửa hồ sơ sau khi bị từ chối sẽ đưa hồ sơ về trạng thái chờ duyệt lại
      profile.setOrganizationName(request.organizationName());
      profile.setLicenseNumber(request.licenseNumber());
      profile.setLicenseDocumentUrl(request.licenseDocumentUrl());
      profile.setVerificationStatus(VerificationStatus.PENDING);
      profile.setRejectionReason(null);
      profile.setReviewedAt(null);
      profile.setReviewedBy(null);
      profile.setSubmittedAt(Instant.now());
    }
    return clinicProfileRepository.save(profile);
  }

  @Transactional(readOnly = true)
  public ClinicProfile getProfileByUserId(UUID clinicUserId) {
    return clinicProfileRepository
        .findByUserId(clinicUserId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Phòng khám chưa nộp hồ sơ đăng ký tổ chức. Vui lòng hoàn tất FR-22 trước."));
  }

  @Transactional(readOnly = true)
  public List<ClinicProfile> getProfilesByStatus(VerificationStatus status) {
    return status == null ? clinicProfileRepository.findAll() : clinicProfileRepository.findByVerificationStatus(status);
  }

  @Transactional
  public ClinicProfile review(UUID clinicProfileId, boolean approve, String rejectionReason, UUID reviewerId) {
    ClinicProfile profile = clinicProfileRepository
        .findById(clinicProfileId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ phòng khám"));
    User reviewer = userRepository.findById(reviewerId).orElse(null);

    profile.setVerificationStatus(approve ? VerificationStatus.APPROVED : VerificationStatus.REJECTED);
    profile.setRejectionReason(approve ? null : rejectionReason);
    profile.setReviewedAt(Instant.now());
    profile.setReviewedBy(reviewer);
    return clinicProfileRepository.save(profile);
  }
}
