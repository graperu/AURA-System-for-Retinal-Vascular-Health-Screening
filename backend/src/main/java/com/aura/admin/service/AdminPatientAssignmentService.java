package com.aura.admin.service;

import com.aura.admin.dto.*;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminPatientAssignmentService {
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final PatientMedicalProfileRepository profileRepository;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;

  public AdminPatientAssignmentService(
      DoctorPatientAssignmentRepository assignmentRepository,
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository) {
    this.assignmentRepository = assignmentRepository;
    this.profileRepository = profileRepository;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
  }

  @Transactional(readOnly = true)
  public AssignmentBoardResponse getBoard() {
    List<User> doctors = userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR);
    List<User> patients = userRoleRepository.findActiveUsersByRole(RoleName.USER);
    List<DoctorPatientAssignment> active = assignmentRepository.findByStatus(AssignmentStatus.ACTIVE);

    Map<UUID, Long> doctorCounts = active.stream().collect(Collectors.groupingBy(
        a -> a.getDoctor().getId(), Collectors.counting()));
    Map<UUID, List<UUID>> patientDoctors = active.stream().collect(Collectors.groupingBy(
        a -> a.getPatient().getId(),
        Collectors.mapping(a -> a.getDoctor().getId(), Collectors.toList())));
    Map<UUID, PatientMedicalProfile> profiles = profileRepository.findAll().stream()
        .collect(Collectors.toMap(p -> p.getUser().getId(), Function.identity()));

    List<AssignmentDoctorDto> doctorDtos = doctors.stream()
        .map(d -> new AssignmentDoctorDto(d.getId(), d.getFullName(), d.getEmail(),
            doctorCounts.getOrDefault(d.getId(), 0L)))
        .toList();
    List<AssignmentPatientDto> patientDtos = patients.stream()
        .map(p -> new AssignmentPatientDto(
            p.getId(), p.getFullName(), p.getEmail(),
            Optional.ofNullable(profiles.get(p.getId())).map(PatientMedicalProfile::getMrn).orElse(null),
            patientDoctors.getOrDefault(p.getId(), List.of())))
        .toList();
    return new AssignmentBoardResponse(doctorDtos, patientDtos);
  }

  @Transactional
  public AssignmentBoardResponse assign(BulkPatientAssignmentRequest request, UUID assignedBy) {
    User doctor = requireRole(request.doctorId(), RoleName.DOCTOR, "Bác sĩ");
    List<UUID> patientIds = request.patientIds().stream().distinct().toList();
    for (UUID patientId : patientIds) {
      User patient = requireRole(patientId, RoleName.USER, "Bệnh nhân");
      if (request.replaceExisting()) {
        assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE).stream()
            .filter(a -> !a.getDoctor().getId().equals(doctor.getId()))
            .forEach(a -> a.setStatus(AssignmentStatus.INACTIVE));
      }
      DoctorPatientAssignment assignment = assignmentRepository
          .findByDoctorIdAndPatientId(doctor.getId(), patientId)
          .orElseGet(() -> new DoctorPatientAssignment(doctor, patient, AssignmentStatus.ACTIVE, assignedBy));
      assignment.setStatus(AssignmentStatus.ACTIVE);
      assignment.setAssignedAt(Instant.now());
      assignment.setAssignedBy(assignedBy);
      assignmentRepository.save(assignment);
      profileRepository.findByUserId(patientId).ifPresent(profile -> {
        profile.setAssignedDoctor(doctor.getFullName() != null ? doctor.getFullName() : doctor.getEmail());
        profileRepository.save(profile);
      });
    }
    return getBoard();
  }

  @Transactional
  public AssignmentBoardResponse unassign(UUID doctorId, UUID patientId) {
    DoctorPatientAssignment assignment = assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công bác sĩ - bệnh nhân"));
    assignment.setStatus(AssignmentStatus.INACTIVE);
    assignmentRepository.save(assignment);
    List<DoctorPatientAssignment> remaining = assignmentRepository
        .findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE);
    profileRepository.findByUserId(patientId).ifPresent(profile -> {
      String doctorNames = remaining.stream()
          .map(a -> a.getDoctor().getFullName() != null ? a.getDoctor().getFullName() : a.getDoctor().getEmail())
          .collect(Collectors.joining(", "));
      profile.setAssignedDoctor(doctorNames.isBlank() ? null : doctorNames);
      profileRepository.save(profile);
    });
    return getBoard();
  }

  private User requireRole(UUID userId, RoleName role, String label) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException(label + " không tồn tại với ID: " + userId));
    if (!user.isActive() || !userRoleRepository.existsByUserIdAndRole(userId, role)) {
      throw new IllegalArgumentException(label + " không hoạt động hoặc không đúng vai trò");
    }
    return user;
  }
}
