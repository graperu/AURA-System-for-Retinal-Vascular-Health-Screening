package com.aura.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.AssignmentBoardResponse;
import com.aura.admin.dto.BulkPatientAssignmentRequest;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminPatientAssignmentService - Optimized Doctor Name to Email Fallback Tests")
class AdminPatientAssignmentServiceOptimizedTest {

  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private PatientMedicalProfileRepository profileRepository;
  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;

  private AdminPatientAssignmentService assignmentService;
  private UUID doctorId;
  private UUID patientId;
  private UUID adminId;

  @BeforeEach
  void setUp() {
    assignmentService =
        new AdminPatientAssignmentService(
            assignmentRepository,
            profileRepository,
            userRepository,
            userRoleRepository);

    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    adminId = UUID.randomUUID();
  }

  @Test
  @DisplayName("assign: Fallback sang email bác sĩ khi fullName của bác sĩ là null")
  void testAssignDoctorFallbackToEmailWhenFullNameIsNull() {
    User doctorWithoutName = new User("dr.no-name@aura.hospital", "hash", null);
    ReflectionTestUtils.setField(doctorWithoutName, "id", doctorId);
    doctorWithoutName.setActive(true);

    User patientUser = new User("patient@aura.hospital", "hash", "Patient Alice");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
    patientUser.setActive(true);

    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorWithoutName));
    when(userRoleRepository.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(true);

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRoleRepository.existsByUserIdAndRole(patientId, RoleName.USER)).thenReturn(true);

    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());

    PatientMedicalProfile profile = new PatientMedicalProfile(patientUser, "MRN-ALICE");
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    // getBoard mocks
    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctorWithoutName));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patientUser));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(Collections.emptyList());
    when(profileRepository.findAll()).thenReturn(List.of(profile));

    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(doctorId, List.of(patientId), false);
    AssignmentBoardResponse board = assignmentService.assign(request, adminId);

    assertThat(board).isNotNull();
    ArgumentCaptor<PatientMedicalProfile> profileCaptor = ArgumentCaptor.forClass(PatientMedicalProfile.class);
    verify(profileRepository).save(profileCaptor.capture());
    assertThat(profileCaptor.getValue().getAssignedDoctor()).isEqualTo("dr.no-name@aura.hospital");
  }

  @Test
  @DisplayName("assign: Sử dụng fullName khi bác sĩ có họ tên đầy đủ (không fallback email)")
  void testAssignDoctorUsesFullNameWhenPresent() {
    User doctorWithName = new User("dr.smith@aura.hospital", "hash", "Dr. John Smith");
    ReflectionTestUtils.setField(doctorWithName, "id", doctorId);
    doctorWithName.setActive(true);

    User patientUser = new User("patient@aura.hospital", "hash", "Patient Bob");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
    patientUser.setActive(true);

    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorWithName));
    when(userRoleRepository.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(true);

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRoleRepository.existsByUserIdAndRole(patientId, RoleName.USER)).thenReturn(true);

    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());

    PatientMedicalProfile profile = new PatientMedicalProfile(patientUser, "MRN-BOB");
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctorWithName));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patientUser));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(Collections.emptyList());
    when(profileRepository.findAll()).thenReturn(List.of(profile));

    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(doctorId, List.of(patientId), false);
    assignmentService.assign(request, adminId);

    ArgumentCaptor<PatientMedicalProfile> profileCaptor = ArgumentCaptor.forClass(PatientMedicalProfile.class);
    verify(profileRepository).save(profileCaptor.capture());
    assertThat(profileCaptor.getValue().getAssignedDoctor()).isEqualTo("Dr. John Smith");
  }

  @Test
  @DisplayName("unassign: Fallback danh sách bác sĩ còn lại sang email nếu fullName là null")
  void testUnassignFallbackRemainingDoctorsToEmail() {
    User currentDoctor = new User("dr.unassigned@aura.hospital", "pass", "Dr. Leaving");
    ReflectionTestUtils.setField(currentDoctor, "id", doctorId);

    User remainingDoctor1 = new User("remaining1@aura.hospital", "pass", "Dr. Active Staying");
    ReflectionTestUtils.setField(remainingDoctor1, "id", UUID.randomUUID());

    User remainingDoctor2 = new User("remaining2.no.name@aura.hospital", "pass", null);
    ReflectionTestUtils.setField(remainingDoctor2, "id", UUID.randomUUID());

    User patientUser = new User("patient@aura.hospital", "pass", "Patient Charlie");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    DoctorPatientAssignment assignment = new DoctorPatientAssignment(currentDoctor, patientUser, AssignmentStatus.ACTIVE, adminId);
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.of(assignment));

    DoctorPatientAssignment remain1 = new DoctorPatientAssignment(remainingDoctor1, patientUser, AssignmentStatus.ACTIVE, adminId);
    DoctorPatientAssignment remain2 = new DoctorPatientAssignment(remainingDoctor2, patientUser, AssignmentStatus.ACTIVE, adminId);
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(remain1, remain2));

    PatientMedicalProfile profile = new PatientMedicalProfile(patientUser, "MRN-CHARLIE");
    profile.setAssignedDoctor("Old Doctors");
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(remainingDoctor1, remainingDoctor2));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patientUser));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of(remain1, remain2));
    when(profileRepository.findAll()).thenReturn(List.of(profile));

    assignmentService.unassign(doctorId, patientId);

    ArgumentCaptor<PatientMedicalProfile> profileCaptor = ArgumentCaptor.forClass(PatientMedicalProfile.class);
    verify(profileRepository).save(profileCaptor.capture());
    assertThat(profileCaptor.getValue().getAssignedDoctor())
        .isEqualTo("Dr. Active Staying, remaining2.no.name@aura.hospital");
  }

  @Test
  @DisplayName("unassign: Đặt assignedDoctor thành null khi không còn bác sĩ nào phụ trách bệnh nhân")
  void testUnassignSetsNullWhenNoRemainingDoctors() {
    User currentDoctor = new User("dr.only@aura.hospital", "pass", "Dr. Only");
    ReflectionTestUtils.setField(currentDoctor, "id", doctorId);

    User patientUser = new User("patient@aura.hospital", "pass", "Patient Alone");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    DoctorPatientAssignment assignment = new DoctorPatientAssignment(currentDoctor, patientUser, AssignmentStatus.ACTIVE, adminId);
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.of(assignment));
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE))
        .thenReturn(Collections.emptyList());

    PatientMedicalProfile profile = new PatientMedicalProfile(patientUser, "MRN-ALONE");
    profile.setAssignedDoctor("Dr. Only");
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(Collections.emptyList());
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patientUser));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(Collections.emptyList());
    when(profileRepository.findAll()).thenReturn(List.of(profile));

    assignmentService.unassign(doctorId, patientId);

    ArgumentCaptor<PatientMedicalProfile> profileCaptor = ArgumentCaptor.forClass(PatientMedicalProfile.class);
    verify(profileRepository).save(profileCaptor.capture());
    assertThat(profileCaptor.getValue().getAssignedDoctor()).isNull();
  }

  @Test
  @DisplayName("assign: Gán lại chính bác sĩ đó khi phân công đã tồn tại trong cơ sở dữ liệu")
  void testAssignExistingAssignmentUpdated() {
    User doctor = new User("dr.exist@aura.hospital", "hash", "Dr. Existing");
    ReflectionTestUtils.setField(doctor, "id", doctorId);
    doctor.setActive(true);

    User patientUser = new User("patient.exist@aura.hospital", "hash", "Patient Exist");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
    patientUser.setActive(true);

    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctor));
    when(userRoleRepository.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(true);
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRoleRepository.existsByUserIdAndRole(patientId, RoleName.USER)).thenReturn(true);

    DoctorPatientAssignment existingAssignment = new DoctorPatientAssignment(doctor, patientUser, AssignmentStatus.INACTIVE, adminId);
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.of(existingAssignment));

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patientUser));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of(existingAssignment));
    when(profileRepository.findAll()).thenReturn(Collections.emptyList());

    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(doctorId, List.of(patientId), false);
    assignmentService.assign(request, adminId);

    assertThat(existingAssignment.getStatus()).isEqualTo(AssignmentStatus.ACTIVE);
    verify(assignmentRepository).save(existingAssignment);
  }

  @Test
  @DisplayName("assign: replaceExisting=true vô hiệu hóa phân công của các bác sĩ khác")
  void testAssignReplaceExistingDeactivatesOtherDoctors() {
    User doctor = new User("dr.new@aura.hospital", "hash", "Dr. New");
    ReflectionTestUtils.setField(doctor, "id", doctorId);
    doctor.setActive(true);

    User oldDoctor = new User("dr.old@aura.hospital", "hash", "Dr. Old");
    UUID oldDoctorId = UUID.randomUUID();
    ReflectionTestUtils.setField(oldDoctor, "id", oldDoctorId);

    User patientUser = new User("patient.replace@aura.hospital", "hash", "Patient Replace");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
    patientUser.setActive(true);

    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctor));
    when(userRoleRepository.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(true);
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRoleRepository.existsByUserIdAndRole(patientId, RoleName.USER)).thenReturn(true);

    DoctorPatientAssignment oldAssignment = new DoctorPatientAssignment(oldDoctor, patientUser, AssignmentStatus.ACTIVE, adminId);
    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(oldAssignment));

    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patientUser));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(Collections.emptyList());
    when(profileRepository.findAll()).thenReturn(Collections.emptyList());

    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(doctorId, List.of(patientId), true);
    assignmentService.assign(request, adminId);

    assertThat(oldAssignment.getStatus()).isEqualTo(AssignmentStatus.INACTIVE);
  }

  @Test
  @DisplayName("requireRole: Ném ngoại lệ khi user không tồn tại, bị vô hiệu hóa hoặc sai vai trò")
  void testRequireRoleValidationExceptions() {
    // 1. Doctor not found
    when(userRepository.findById(doctorId)).thenReturn(Optional.empty());
    BulkPatientAssignmentRequest req = new BulkPatientAssignmentRequest(doctorId, List.of(patientId), false);
    assertThatThrownBy(() -> assignmentService.assign(req, adminId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining("Bác sĩ không tồn tại");

    // 2. Doctor inactive
    User inactiveDoc = new User("doc.inact@aura.ai", "pass", "Dr. Inactive");
    inactiveDoc.setActive(false);
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(inactiveDoc));
    assertThatThrownBy(() -> assignmentService.assign(req, adminId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không hoạt động hoặc không đúng vai trò");

    // 3. Doctor active nhưng không có role DOCTOR
    inactiveDoc.setActive(true);
    when(userRoleRepository.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(false);
    assertThatThrownBy(() -> assignmentService.assign(req, adminId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không hoạt động hoặc không đúng vai trò");

    // 4. Patient inactive
    when(userRoleRepository.existsByUserIdAndRole(doctorId, RoleName.DOCTOR)).thenReturn(true);
    User inactivePat = new User("pat.inact@aura.ai", "pass", "Pat Inactive");
    inactivePat.setActive(false);
    when(userRepository.findById(patientId)).thenReturn(Optional.of(inactivePat));
    assertThatThrownBy(() -> assignmentService.assign(req, adminId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không hoạt động hoặc không đúng vai trò");
  }

  @Test
  @DisplayName("unassign: Ném ResourceNotFoundException khi không tìm thấy phân công bác sĩ - bệnh nhân")
  void testUnassignNotFoundThrowsException() {
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> assignmentService.unassign(doctorId, patientId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessage("Không tìm thấy phân công bác sĩ - bệnh nhân");
  }
}
