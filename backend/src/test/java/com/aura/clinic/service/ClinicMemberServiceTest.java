package com.aura.clinic.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.entity.ClinicMemberStatus;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * FR-23: Gán quyền bác sĩ vào phòng khám & phân công bệnh nhân cho từng bác sĩ trực thuộc.
 * Also guards the multi-tenant isolation rule: a clinic may only assign patients
 * to doctors that are its own active members.
 */
@ExtendWith(MockitoExtension.class)
class ClinicMemberServiceTest {

  @Mock private ClinicMemberRepository clinicMemberRepository;
  @Mock private com.aura.clinic.repository.ClinicProfileRepository clinicProfileRepository;
  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private DoctorPatientAssignmentService assignmentService;

  private ClinicMemberService service;

  private User clinic;
  private User doctor;
  private UUID clinicId;
  private UUID doctorId;

  @BeforeEach
  void setUp() {
    service = new ClinicMemberService(clinicMemberRepository, clinicProfileRepository, userRepository, userRoleRepository, assignmentService);
    clinicId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    clinic = new User("clinic@aura.test", "hash", "Phong Kham AURA");
    doctor = new User("doctor@aura.test", "hash", "BS. Nguyen Van A");

    var profile = new com.aura.clinic.entity.ClinicProfile(clinic, "Phong Kham AURA", "GP-01", "http://document.url/gp.pdf");
    profile.setVerificationStatus(com.aura.clinic.entity.VerificationStatus.APPROVED);
    lenient().when(clinicProfileRepository.findByUserId(clinicId)).thenReturn(Optional.of(profile));
  }

  @Test
  void addDoctor_whenDoctorExistsWithDoctorRole_createsActiveMember() {
    when(userRepository.findById(clinicId)).thenReturn(Optional.of(clinic));
    when(userRepository.findByEmailIgnoreCase("doctor@aura.test")).thenReturn(Optional.of(doctor));
    when(userRoleRepository.existsByUserIdAndRole(any(), eq(RoleName.DOCTOR))).thenReturn(true);
    when(clinicMemberRepository.findByClinicIdAndDoctorId(any(), any())).thenReturn(Optional.empty());
    when(clinicMemberRepository.save(any(ClinicMember.class))).thenAnswer(inv -> inv.getArgument(0));

    ClinicMember result = service.addDoctor(clinicId, "doctor@aura.test");

    assertThat(result.getStatus()).isEqualTo(ClinicMemberStatus.ACTIVE);
    assertThat(result.getDoctor()).isEqualTo(doctor);
    verify(clinicMemberRepository).save(any(ClinicMember.class));
  }

  @Test
  void addDoctor_whenEmailNotFound_throws() {
    when(userRepository.findById(clinicId)).thenReturn(Optional.of(clinic));
    when(userRepository.findByEmailIgnoreCase("ghost@aura.test")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.addDoctor(clinicId, "ghost@aura.test"))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void addDoctor_whenAccountIsNotADoctorRole_throwsIllegalArgument() {
    when(userRepository.findById(clinicId)).thenReturn(Optional.of(clinic));
    when(userRepository.findByEmailIgnoreCase("doctor@aura.test")).thenReturn(Optional.of(doctor));
    when(userRoleRepository.existsByUserIdAndRole(any(), eq(RoleName.DOCTOR))).thenReturn(false);

    assertThatThrownBy(() -> service.addDoctor(clinicId, "doctor@aura.test"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("DOCTOR");
    verify(clinicMemberRepository, never()).save(any());
  }

  @Test
  void addDoctor_whenPreviouslyRevoked_reactivatesExistingMembership() {
    ClinicMember revoked = new ClinicMember(clinic, doctor);
    revoked.setStatus(ClinicMemberStatus.REVOKED);

    when(userRepository.findById(clinicId)).thenReturn(Optional.of(clinic));
    when(userRepository.findByEmailIgnoreCase("doctor@aura.test")).thenReturn(Optional.of(doctor));
    when(userRoleRepository.existsByUserIdAndRole(any(), eq(RoleName.DOCTOR))).thenReturn(true);
    when(clinicMemberRepository.findByClinicIdAndDoctorId(any(), any())).thenReturn(Optional.of(revoked));
    when(clinicMemberRepository.save(any(ClinicMember.class))).thenAnswer(inv -> inv.getArgument(0));

    ClinicMember result = service.addDoctor(clinicId, "doctor@aura.test");

    assertThat(result.getStatus()).isEqualTo(ClinicMemberStatus.ACTIVE);
    verify(clinicMemberRepository, never()).save(argThat(m -> m != revoked));
  }

  @Test
  void removeDoctor_whenMemberBelongsToClinic_marksRevoked() {
    UUID memberId = UUID.randomUUID();
    ClinicMember member = new ClinicMember(clinic, doctor);
    setId(clinic, clinicId);
    when(clinicMemberRepository.findById(memberId)).thenReturn(Optional.of(member));
    when(clinicMemberRepository.save(any(ClinicMember.class))).thenAnswer(inv -> inv.getArgument(0));

    service.removeDoctor(clinicId, memberId);

    assertThat(member.getStatus()).isEqualTo(ClinicMemberStatus.REVOKED);
    verify(clinicMemberRepository).save(member);
  }

  @Test
  void removeDoctor_whenMemberBelongsToDifferentClinic_throws() {
    UUID memberId = UUID.randomUUID();
    User otherClinic = new User("other-clinic@aura.test", "hash", "Phong Kham Khac");
    setId(otherClinic, UUID.randomUUID());
    ClinicMember member = new ClinicMember(otherClinic, doctor);

    when(clinicMemberRepository.findById(memberId)).thenReturn(Optional.of(member));

    assertThatThrownBy(() -> service.removeDoctor(clinicId, memberId))
        .isInstanceOf(ResourceNotFoundException.class);
    verify(clinicMemberRepository, never()).save(any());
  }

  @Test
  void assignPatientToOwnDoctor_whenDoctorIsActiveMember_delegatesToAssignmentService() {
    UUID patientId = UUID.randomUUID();
    UUID assignedBy = clinicId;
    ClinicMember member = new ClinicMember(clinic, doctor);
    DoctorPatientAssignment assignment = new DoctorPatientAssignment(doctor, new User("p@aura.test", "h", "BN"), AssignmentStatus.ACTIVE, assignedBy);

    when(clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.of(member));
    when(assignmentService.assignPatient(doctorId, patientId, assignedBy)).thenReturn(assignment);

    DoctorPatientAssignment result = service.assignPatientToOwnDoctor(clinicId, doctorId, patientId, assignedBy);

    assertThat(result).isSameAs(assignment);
    verify(assignmentService).assignPatient(doctorId, patientId, assignedBy);
  }

  @Test
  void assignPatientToOwnDoctor_whenDoctorNotInClinic_throwsAndNeverAssigns() {
    UUID patientId = UUID.randomUUID();
    when(clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.assignPatientToOwnDoctor(clinicId, doctorId, patientId, clinicId))
        .isInstanceOf(IllegalArgumentException.class);
    verify(assignmentService, never()).assignPatient(any(), any(), any());
  }

  @Test
  void assignPatientToOwnDoctor_whenMembershipRevoked_throwsAndNeverAssigns() {
    UUID patientId = UUID.randomUUID();
    ClinicMember revoked = new ClinicMember(clinic, doctor);
    revoked.setStatus(ClinicMemberStatus.REVOKED);
    when(clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.of(revoked));

    assertThatThrownBy(() -> service.assignPatientToOwnDoctor(clinicId, doctorId, patientId, clinicId))
        .isInstanceOf(IllegalArgumentException.class);
    verify(assignmentService, never()).assignPatient(any(), any(), any());
  }

  /** Test-only helper: the id field has no public setter, so tests reach through reflection. */
  private static void setId(User user, UUID id) {
    try {
      var field = User.class.getDeclaredField("id");
      field.setAccessible(true);
      field.set(user, id);
    } catch (ReflectiveOperationException e) {
      throw new RuntimeException(e);
    }
  }
}
