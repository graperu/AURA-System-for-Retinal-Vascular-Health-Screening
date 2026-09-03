package com.aura.auth.service;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("patientAccessService")
@Transactional(readOnly = true)
public class PatientAccessService {

  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final ScreeningRepository screeningRepository;

  public PatientAccessService(
      DoctorPatientAssignmentRepository assignmentRepository,
      ScreeningRepository screeningRepository) {
    this.assignmentRepository = assignmentRepository;
    this.screeningRepository = screeningRepository;
  }

  public boolean canAccessPatient(AuraUserPrincipal principal, UUID patientId) {
    if (principal == null || patientId == null) {
      return false;
    }
    if (hasRole(principal, "ADMIN")) {
      return true;
    }
    if (hasRole(principal, "USER") && principal.id().equals(patientId)) {
      return true;
    }
    if (hasRole(principal, "DOCTOR")) {
      return assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
          principal.id(), patientId, AssignmentStatus.ACTIVE);
    }
    return false;
  }

  public boolean canCurrentDoctorAccess(UUID patientId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof AuraUserPrincipal principal) {
      return canAccessPatient(principal, patientId);
    }
    return false;
  }

  public boolean canAccessScreening(AuraUserPrincipal principal, UUID screeningId) {
    if (principal == null || screeningId == null) {
      return false;
    }
    if (hasRole(principal, "ADMIN")) {
      return true;
    }
    Screening screening = screeningRepository.findById(screeningId).orElse(null);
    if (screening == null) {
      return false;
    }
    return canAccessPatient(principal, screening.getPatientId());
  }

  public boolean canReviewScreening(AuraUserPrincipal principal, UUID screeningId) {
    if (principal == null || screeningId == null) {
      return false;
    }
    if (hasRole(principal, "ADMIN")) {
      return true;
    }
    if (!hasRole(principal, "DOCTOR")) {
      return false;
    }
    Screening screening = screeningRepository.findById(screeningId).orElse(null);
    if (screening == null) {
      return false;
    }
    return assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
        principal.id(), screening.getPatientId(), AssignmentStatus.ACTIVE);
  }

  private boolean hasRole(AuraUserPrincipal principal, String role) {
    if (principal == null || principal.roles() == null) {
      return false;
    }
    return principal.roles().stream().anyMatch(r -> r.equalsIgnoreCase(role));
  }
}
