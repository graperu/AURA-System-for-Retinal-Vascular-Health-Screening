package com.aura.clinic.dto;

import com.aura.clinic.entity.ClinicProfile;
import java.time.Instant;
import java.util.UUID;

public record ClinicProfileResponse(
    UUID id,
    UUID userId,
    String organizationName,
    String licenseNumber,
    String licenseDocumentUrl,
    String verificationStatus,
    String rejectionReason,
    Instant submittedAt,
    Instant reviewedAt) {

  public static ClinicProfileResponse from(ClinicProfile p) {
    return new ClinicProfileResponse(
        p.getId(),
        p.getUser().getId(),
        p.getOrganizationName(),
        p.getLicenseNumber(),
        p.getLicenseDocumentUrl(),
        p.getVerificationStatus().name(),
        p.getRejectionReason(),
        p.getSubmittedAt(),
        p.getReviewedAt());
  }
}
