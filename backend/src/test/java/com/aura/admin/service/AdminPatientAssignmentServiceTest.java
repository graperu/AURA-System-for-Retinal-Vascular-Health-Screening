package com.aura.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.AssignmentBoardResponse;
import com.aura.admin.dto.BulkPatientAssignmentRequest;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminPatientAssignmentServiceTest {

  @Mock
  private DoctorPatientAssignmentRepository assignmentRepository;

  @Mock
  private PatientMedicalProfileRepository profileRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private UserRoleRepository userRoleRepository;

  private AdminPatientAssignmentService service;

  private User doctor1;
  private User doctor2;
  private User patient1;
  private User patient2;
  private UUID doctor1Id;
  private UUID doctor2Id;
  private UUID patient1Id;
  private UUID patient2Id;
  private UUID adminId;

  @BeforeEach
  void setUp() {
    service = new AdminPatientAssignmentService(
        assignmentRepository,
        profileRepository,
        userRepository,
        userRoleRepository
    );

    doctor1Id = UUID.randomUUID();
    doctor2Id = UUID.randomUUID();
    patient1Id = UUID.randomUUID();
    patient2Id = UUID.randomUUID();
    adminId = UUID.randomUUID();

    doctor1 = new User("dr1@aura.test", "hash", "BS. Nguyen Van Doctor");
    doctor1.setActive(true);
    ReflectionTestUtils.setField(doctor1, "id", doctor1Id);

    doctor2 = new User("dr2@aura.test", "hash", "BS. Tran Thi Doctor");
    doctor2.setActive(true);
    ReflectionTestUtils.setField(doctor2, "id", doctor2Id);

    patient1 = new User("pat1@aura.test", "hash", "Nguyen Van Patient");
    patient1.setActive(true);
    ReflectionTestUtils.setField(patient1, "id", patient1Id);

    patient2 = new User("pat2@aura.test", "hash", "Le Thi Patient");
    patient2.setActive(true);
    ReflectionTestUtils.setField(patient2, "id", patient2Id);
  }

  @Test
  @DisplayName("getBoard: Lấy danh sách phân công tổng thể kèm số lượng bệnh nhân của bác sĩ và MRN bệnh nhân")
  void getBoard_success() {
    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor1, doctor2));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patient1, patient2));

    DoctorPatientAssignment a1 = new DoctorPatientAssignment(doctor1, patient1, AssignmentStatus.ACTIVE, adminId);
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of(a1));

    PatientMedicalProfile profile1 = new PatientMedicalProfile(patient1, "MRN-2026-0001");
    when(profileRepository.findAll()).thenReturn(List.of(profile1));

    AssignmentBoardResponse board = service.getBoard();

    assertThat(board).isNotNull();
    assertThat(board.doctors()).hasSize(2);
    assertThat(board.doctors().get(0).id()).isEqualTo(doctor1Id);
    assertThat(board.doctors().get(0).assignedPatientCount()).isEqualTo(1L);
    assertThat(board.doctors().get(1).assignedPatientCount()).isEqualTo(0L);

    assertThat(board.patients()).hasSize(2);
    assertThat(board.patients().get(0).id()).isEqualTo(patient1Id);
    assertThat(board.patients().get(0).mrn()).isEqualTo("MRN-2026-0001");
    assertThat(board.patients().get(0).assignedDoctorIds()).containsExactly(doctor1Id);
    assertThat(board.patients().get(1).assignedDoctorIds()).isEmpty();
  }

  @Test
  @DisplayName("assign: Phân công nhiều bệnh nhân cho bác sĩ thành công (replaceExisting = false)")
  void assign_multiplePatients_withoutReplaceExisting_success() {
    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(
        doctor1Id, List.of(patient1Id, patient2Id), false
    );

    // Mock doctor validation
    when(userRepository.findById(doctor1Id)).thenReturn(Optional.of(doctor1));
    when(userRoleRepository.existsByUserIdAndRole(doctor1Id, RoleName.DOCTOR)).thenReturn(true);

    // Mock patient 1 validation
    when(userRepository.findById(patient1Id)).thenReturn(Optional.of(patient1));
    when(userRoleRepository.existsByUserIdAndRole(patient1Id, RoleName.USER)).thenReturn(true);

    // Mock patient 2 validation
    when(userRepository.findById(patient2Id)).thenReturn(Optional.of(patient2));
    when(userRoleRepository.existsByUserIdAndRole(patient2Id, RoleName.USER)).thenReturn(true);

    when(assignmentRepository.findByDoctorIdAndPatientId(doctor1Id, patient1Id)).thenReturn(Optional.empty());
    when(assignmentRepository.findByDoctorIdAndPatientId(doctor1Id, patient2Id)).thenReturn(Optional.empty());

    PatientMedicalProfile prof1 = new PatientMedicalProfile(patient1, "MRN-1");
    when(profileRepository.findByUserId(patient1Id)).thenReturn(Optional.of(prof1));
    when(profileRepository.findByUserId(patient2Id)).thenReturn(Optional.empty());

    // Mock getBoard response dependencies
    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor1));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patient1, patient2));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of());
    when(profileRepository.findAll()).thenReturn(List.of(prof1));

    AssignmentBoardResponse result = service.assign(request, adminId);

    assertThat(result).isNotNull();
    verify(assignmentRepository, org.mockito.Mockito.times(2)).save(any(DoctorPatientAssignment.class));
    assertThat(prof1.getAssignedDoctor()).isEqualTo("BS. Nguyen Van Doctor");
    verify(profileRepository).save(prof1);
  }

  @Test
  @DisplayName("assign: Với replaceExisting = true -> vô hiệu hóa các phân công cũ của các bác sĩ khác")
  void assign_withReplaceExistingTrue_inactivatesOtherDoctorAssignments() {
    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(
        doctor1Id, List.of(patient1Id), true
    );

    when(userRepository.findById(doctor1Id)).thenReturn(Optional.of(doctor1));
    when(userRoleRepository.existsByUserIdAndRole(doctor1Id, RoleName.DOCTOR)).thenReturn(true);

    when(userRepository.findById(patient1Id)).thenReturn(Optional.of(patient1));
    when(userRoleRepository.existsByUserIdAndRole(patient1Id, RoleName.USER)).thenReturn(true);

    // Existing assignment to Doctor 2
    DoctorPatientAssignment oldAssignment = new DoctorPatientAssignment(
        doctor2, patient1, AssignmentStatus.ACTIVE, adminId
    );
    when(assignmentRepository.findByPatientIdAndStatus(patient1Id, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(oldAssignment));

    when(assignmentRepository.findByDoctorIdAndPatientId(doctor1Id, patient1Id)).thenReturn(Optional.empty());

    when(profileRepository.findByUserId(patient1Id)).thenReturn(Optional.empty());

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor1, doctor2));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patient1));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of());
    when(profileRepository.findAll()).thenReturn(List.of());

    service.assign(request, adminId);

    assertThat(oldAssignment.getStatus()).isEqualTo(AssignmentStatus.INACTIVE);
    verify(assignmentRepository).save(any(DoctorPatientAssignment.class));
  }

  @Test
  @DisplayName("assign: Bác sĩ không tồn tại -> ném ResourceNotFoundException")
  void assign_whenDoctorNotFound_throwsException() {
    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(
        doctor1Id, List.of(patient1Id), false
    );
    when(userRepository.findById(doctor1Id)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.assign(request, adminId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Bác sĩ không tồn tại với ID");
  }

  @Test
  @DisplayName("assign: Người được chọn làm bác sĩ nhưng không active hoặc không có vai trò DOCTOR -> ném IllegalArgumentException")
  void assign_whenUserNotDoctorRoleOrInactive_throwsException() {
    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(
        doctor1Id, List.of(patient1Id), false
    );
    when(userRepository.findById(doctor1Id)).thenReturn(Optional.of(doctor1));
    when(userRoleRepository.existsByUserIdAndRole(doctor1Id, RoleName.DOCTOR)).thenReturn(false);

    assertThatThrownBy(() -> service.assign(request, adminId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không hoạt động hoặc không đúng vai trò");
  }

  @Test
  @DisplayName("assign: Bệnh nhân không tồn tại -> ném ResourceNotFoundException")
  void assign_whenPatientNotFound_throwsException() {
    BulkPatientAssignmentRequest request = new BulkPatientAssignmentRequest(
        doctor1Id, List.of(patient1Id), false
    );
    when(userRepository.findById(doctor1Id)).thenReturn(Optional.of(doctor1));
    when(userRoleRepository.existsByUserIdAndRole(doctor1Id, RoleName.DOCTOR)).thenReturn(true);
    when(userRepository.findById(patient1Id)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.assign(request, adminId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Bệnh nhân không tồn tại với ID");
  }

  @Test
  @DisplayName("unassign: Hủy phân công thành công và cập nhật lại bác sĩ còn lại trong hồ sơ bệnh nhân")
  void unassign_whenRemainingDoctorsExist_updatesAssignedDoctorProfile() {
    DoctorPatientAssignment targetAssignment = new DoctorPatientAssignment(
        doctor1, patient1, AssignmentStatus.ACTIVE, adminId
    );
    when(assignmentRepository.findByDoctorIdAndPatientId(doctor1Id, patient1Id))
        .thenReturn(Optional.of(targetAssignment));

    DoctorPatientAssignment remainingAssignment = new DoctorPatientAssignment(
        doctor2, patient1, AssignmentStatus.ACTIVE, adminId
    );
    when(assignmentRepository.findByPatientIdAndStatus(patient1Id, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(remainingAssignment));

    PatientMedicalProfile profile = new PatientMedicalProfile(patient1, "MRN-1");
    when(profileRepository.findByUserId(patient1Id)).thenReturn(Optional.of(profile));

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor1, doctor2));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patient1));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of(remainingAssignment));
    when(profileRepository.findAll()).thenReturn(List.of(profile));

    service.unassign(doctor1Id, patient1Id);

    assertThat(targetAssignment.getStatus()).isEqualTo(AssignmentStatus.INACTIVE);
    assertThat(profile.getAssignedDoctor()).isEqualTo("BS. Tran Thi Doctor");
    verify(profileRepository).save(profile);
  }

  @Test
  @DisplayName("unassign: Hủy phân công khi không còn bác sĩ nào phụ trách -> gán assignedDoctor = null")
  void unassign_whenNoRemainingDoctors_clearsAssignedDoctorInProfile() {
    DoctorPatientAssignment targetAssignment = new DoctorPatientAssignment(
        doctor1, patient1, AssignmentStatus.ACTIVE, adminId
    );
    when(assignmentRepository.findByDoctorIdAndPatientId(doctor1Id, patient1Id))
        .thenReturn(Optional.of(targetAssignment));

    when(assignmentRepository.findByPatientIdAndStatus(patient1Id, AssignmentStatus.ACTIVE))
        .thenReturn(List.of());

    PatientMedicalProfile profile = new PatientMedicalProfile(patient1, "MRN-1");
    profile.setAssignedDoctor("BS. Nguyen Van Doctor");
    when(profileRepository.findByUserId(patient1Id)).thenReturn(Optional.of(profile));

    when(userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor1));
    when(userRoleRepository.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patient1));
    when(assignmentRepository.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(List.of());
    when(profileRepository.findAll()).thenReturn(List.of(profile));

    service.unassign(doctor1Id, patient1Id);

    assertThat(targetAssignment.getStatus()).isEqualTo(AssignmentStatus.INACTIVE);
    assertThat(profile.getAssignedDoctor()).isNull();
    verify(profileRepository).save(profile);
  }

  @Test
  @DisplayName("unassign: Không tìm thấy phân công bác sĩ - bệnh nhân -> ném ResourceNotFoundException")
  void unassign_whenAssignmentNotFound_throwsException() {
    when(assignmentRepository.findByDoctorIdAndPatientId(doctor1Id, patient1Id))
        .thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.unassign(doctor1Id, patient1Id))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy phân công bác sĩ - bệnh nhân");
  }
}
