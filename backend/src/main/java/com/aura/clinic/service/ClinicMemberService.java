package com.aura.clinic.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.entity.ClinicMemberStatus;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-23: Gán quyền bác sĩ vào phòng khám & phân công bệnh nhân cho từng bác sĩ trực thuộc. */
@Service
public class ClinicMemberService {

  private final ClinicMemberRepository clinicMemberRepository;
  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final DoctorPatientAssignmentService assignmentService;

  public ClinicMemberService(
      ClinicMemberRepository clinicMemberRepository,
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      DoctorPatientAssignmentService assignmentService) {
    this.clinicMemberRepository = clinicMemberRepository;
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.assignmentService = assignmentService;
  }

  @Transactional(readOnly = true)
  public List<ClinicMember> getMembers(UUID clinicId) {
    return clinicMemberRepository.findByClinicId(clinicId);
  }

  @Transactional
  public ClinicMember addDoctor(UUID clinicId, String doctorEmail) {
    User clinic = userRepository
        .findById(clinicId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản phòng khám"));
    User doctor = userRepository
        .findByEmailIgnoreCase(doctorEmail)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Không tìm thấy tài khoản với email: " + doctorEmail));

    if (!userRoleRepository.existsByUserIdAndRole(doctor.getId(), RoleName.DOCTOR)) {
      throw new IllegalArgumentException("Tài khoản " + doctorEmail + " không có vai trò Bác sĩ (DOCTOR)");
    }

    var existing = clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctor.getId());
    if (existing.isPresent()) {
      ClinicMember member = existing.get();
      member.setStatus(ClinicMemberStatus.ACTIVE);
      return clinicMemberRepository.save(member);
    }

    return clinicMemberRepository.save(new ClinicMember(clinic, doctor));
  }

  @Transactional
  public void removeDoctor(UUID clinicId, UUID memberId) {
    ClinicMember member = clinicMemberRepository
        .findById(memberId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ trong danh sách phòng khám"));
    if (!member.getClinic().getId().equals(clinicId)) {
      throw new ResourceNotFoundException("Bác sĩ này không thuộc phòng khám của bạn");
    }
    member.setStatus(ClinicMemberStatus.REVOKED);
    clinicMemberRepository.save(member);
  }

  /** Phòng khám phân công một bệnh nhân cho một bác sĩ trực thuộc chính phòng khám đó. */
  @Transactional
  public DoctorPatientAssignment assignPatientToOwnDoctor(
      UUID clinicId, UUID doctorId, UUID patientId, UUID assignedBy) {
    boolean belongsToClinic = clinicMemberRepository
        .findByClinicIdAndDoctorId(clinicId, doctorId)
        .filter(m -> m.getStatus() == ClinicMemberStatus.ACTIVE)
        .isPresent();
    if (!belongsToClinic) {
      throw new IllegalArgumentException("Bác sĩ được chỉ định không thuộc phòng khám của bạn hoặc đã bị gỡ");
    }
    return assignmentService.assignPatient(doctorId, patientId, assignedBy);
  }
}
