package com.aura.clinic.dto;

import com.aura.clinic.entity.ClinicMember;
import java.time.Instant;
import java.util.UUID;

public record ClinicMemberResponse(
    UUID id, UUID doctorId, String doctorName, String doctorEmail, String status, Instant invitedAt) {

  public static ClinicMemberResponse from(ClinicMember m) {
    return new ClinicMemberResponse(
        m.getId(),
        m.getDoctor().getId(),
        m.getDoctor().getFullName(),
        m.getDoctor().getEmail(),
        m.getStatus().name(),
        m.getInvitedAt());
  }
}
