package com.aura.doctor.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorPatientAssignmentService {

  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final PatientMedicalProfileRepository profileRepository;
  private final PatientProfileService profileService;
  private final ScreeningRepository screeningRepository;
  private final UserRepository userRepository;

  public DoctorPatientAssignmentService(
      DoctorPatientAssignmentRepository assignmentRepository,
      PatientMedicalProfileRepository profileRepository,
      PatientProfileService profileService,
      ScreeningRepository screeningRepository,
      UserRepository userRepository) {
    this.assignmentRepository = assignmentRepository;
    this.profileRepository = profileRepository;
    this.profileService = profileService;
    this.screeningRepository = screeningRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<DoctorPatientSummaryResponse> getAssignedPatients(UUID doctorId) {
    List<DoctorPatientAssignment> assignments =
        assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE);

    List<DoctorPatientSummaryResponse> results = new ArrayList<>();
    for (DoctorPatientAssignment assignment : assignments) {
      User patientUser = assignment.getPatient();
      UUID patientId = patientUser.getId();

      // Retrieve or ensure profile exists
      PatientMedicalProfile profile = profileRepository.findByUserId(patientId).orElse(null);

      String mrn = profile != null ? profile.getMrn() : "MRN-" + patientId.toString().substring(0, 8).toUpperCase();
      String fullName = profile != null && profile.getUser() != null && profile.getUser().getFullName() != null
          ? profile.getUser().getFullName()
          : (patientUser.getFullName() != null ? patientUser.getFullName() : "Bệnh nhân " + mrn);

      List<Screening> screenings = screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
      long count = screenings.size();
      Instant lastScreeningAt = screenings.isEmpty() ? null : screenings.get(0).getCreatedAt();
      String latestRisk = screenings.isEmpty() || screenings.get(0).getRiskLevel() == null
          ? null
          : screenings.get(0).getRiskLevel().name();

      DoctorPatientSummaryResponse summary = new DoctorPatientSummaryResponse(
          patientId,
          mrn,
          fullName,
          patientUser.getEmail(),
          profile != null ? profile.getDateOfBirth() : null,
          profile != null ? profile.getAge() : null,
          profile != null ? profile.getGender() : "Khác",
          profile != null ? profile.getPhoneNumber() : null,
          profile != null ? profile.getAddress() : null,
          profile != null ? profile.getSystolicBp() : null,
          profile != null ? profile.getDiastolicBp() : null,
          profile != null ? profile.getHba1c() : null,
          profile != null ? profile.getHasDiabetes() : null,
          profile != null ? profile.getHasHypertension() : null,
          lastScreeningAt,
          latestRisk,
          count,
          assignment.getAssignedAt(),
          assignment.getStatus().name()
      );
      results.add(summary);
    }

    return results;
  }

  @Transactional
  public DoctorPatientAssignment assignPatient(UUID doctorId, UUID patientId, UUID assignedBy) {
    User doctor = userRepository.findById(doctorId)
        .orElseThrow(() -> new ResourceNotFoundException("Bác sĩ không tồn tại với ID: " + doctorId));
    User patient = userRepository.findById(patientId)
        .orElseThrow(() -> new ResourceNotFoundException("Bệnh nhân không tồn tại với ID: " + patientId));

    Optional<DoctorPatientAssignment> existing =
        assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId);

    if (existing.isPresent()) {
      DoctorPatientAssignment assignment = existing.get();
      assignment.setStatus(AssignmentStatus.ACTIVE);
      assignment.setAssignedAt(Instant.now());
      assignment.setAssignedBy(assignedBy);
      return assignmentRepository.save(assignment);
    }

    DoctorPatientAssignment newAssignment =
        new DoctorPatientAssignment(doctor, patient, AssignmentStatus.ACTIVE, assignedBy);
    return assignmentRepository.save(newAssignment);
  }

  @Transactional
  public void unassignPatient(UUID doctorId, UUID patientId) {
    DoctorPatientAssignment assignment = assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công giữa Bác sĩ và Bệnh nhân"));
    assignment.setStatus(AssignmentStatus.INACTIVE);
    assignmentRepository.save(assignment);
  }
}
