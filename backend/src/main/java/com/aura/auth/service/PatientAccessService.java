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
  private final com.aura.patient.repository.PatientProfileRepository patientProfileRepository;
  private final com.aura.patient.repository.PatientMedicalProfileRepository patientMedicalProfileRepository;
  private final com.aura.user.repository.UserRepository userRepository;

  @org.springframework.beans.factory.annotation.Autowired
  public PatientAccessService(
      DoctorPatientAssignmentRepository assignmentRepository,
      ScreeningRepository screeningRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.patient.repository.PatientProfileRepository patientProfileRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.patient.repository.PatientMedicalProfileRepository patientMedicalProfileRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.user.repository.UserRepository userRepository) {
    this.assignmentRepository = assignmentRepository;
    this.screeningRepository = screeningRepository;
    this.patientProfileRepository = patientProfileRepository;
    this.patientMedicalProfileRepository = patientMedicalProfileRepository;
    this.userRepository = userRepository;
  }

  public PatientAccessService(
      DoctorPatientAssignmentRepository assignmentRepository,
      ScreeningRepository screeningRepository) {
    this(assignmentRepository, screeningRepository, null, null, null);
  }

  public boolean canAccessPatient(AuraUserPrincipal principal, UUID patientId) {
    if (principal == null || patientId == null || principal.roles() == null || principal.roles().isEmpty()) {
      return false;
    }
    if (hasRole(principal, "ADMIN")) {
      return true;
    }
    if ((hasRole(principal, "USER") || hasRole(principal, "PATIENT")) && principal.id().equals(patientId)) {
      return true;
    }
    if (hasRole(principal, "DOCTOR")) {
      if (assignmentRepository != null && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
          principal.id(), patientId, AssignmentStatus.ACTIVE)) {
        return true;
      }

      String doctorFullName = (userRepository != null)
          ? userRepository.findById(principal.id()).map(com.aura.user.entity.User::getFullName).orElse(null)
          : null;

      if (patientProfileRepository != null) {
        var profileOpt = patientProfileRepository.findById(patientId)
            .or(() -> patientProfileRepository.findByUserId(patientId));
        if (profileOpt.isPresent()) {
          var p = profileOpt.get();
          if (p.getUserId() != null && assignmentRepository != null && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
              principal.id(), p.getUserId(), AssignmentStatus.ACTIVE)) {
            return true;
          }
          if (doctorFullName != null && !doctorFullName.isBlank() && p.getAssignedDoctor() != null &&
              doctorFullName.trim().equalsIgnoreCase(p.getAssignedDoctor().trim())) {
            return true;
          }
        }
      }

      if (patientMedicalProfileRepository != null) {
        var medOpt = patientMedicalProfileRepository.findById(patientId)
            .or(() -> patientMedicalProfileRepository.findByUserId(patientId));
        if (medOpt.isPresent()) {
          var med = medOpt.get();
          if (med.getUser() != null && assignmentRepository != null && assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
              principal.id(), med.getUser().getId(), AssignmentStatus.ACTIVE)) {
            return true;
          }
          if (doctorFullName != null && !doctorFullName.isBlank() && med.getAssignedDoctor() != null &&
              doctorFullName.trim().equalsIgnoreCase(med.getAssignedDoctor().trim())) {
            return true;
          }
        }
      }

      if (screeningRepository != null) {
        boolean hasDoctorScreening = screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
            .anyMatch(s -> principal.id().equals(s.getDoctorId()));
        if (hasDoctorScreening) {
          return true;
        }
      }
    }
    return false;
  }

  public boolean canChatBetween(AuraUserPrincipal principal, UUID targetUserId) {
    if (principal == null || targetUserId == null) {
      return false;
    }
    if (hasRole(principal, "ADMIN")) {
      return true;
    }
    // If current user is Patient, they can chat with their assigned Doctor
    if (hasRole(principal, "USER")) {
      return assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
          targetUserId, principal.id(), AssignmentStatus.ACTIVE);
    }
    // If current user is Doctor, they can chat with their assigned Patient
    if (hasRole(principal, "DOCTOR")) {
      return assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(
          principal.id(), targetUserId, AssignmentStatus.ACTIVE);
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
