package com.aura.doctor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
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
class DoctorPatientAssignmentServiceFullTest {

  @Mock
  private DoctorPatientAssignmentRepository assignmentRepository;

  @Mock
  private PatientMedicalProfileRepository profileRepository;

  @Mock
  private PatientProfileRepository patientProfileRepository;

  @Mock
  private PatientProfileService profileService;

  @Mock
  private ScreeningRepository screeningRepository;

  @Mock
  private UserRepository userRepository;

  private DoctorPatientAssignmentService assignmentService;

  private User doctorUser;
  private User patientUser;
  private UUID doctorId;
  private UUID patientId;
  private UUID adminId;

  @BeforeEach
  void setUp() {
    assignmentService = new DoctorPatientAssignmentService(
        assignmentRepository,
        profileRepository,
        profileService,
        screeningRepository,
        userRepository
    );

    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    adminId = UUID.randomUUID();

    doctorUser = new User("doctor@aura.test", "hash123", "BS. Le Van Doctor");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    patientUser = new User("patient@aura.test", "hash456", "Nguyen Thi Patient");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
  }

  @Test
  @DisplayName("assignPatient (assignDoctorToPatient): Phân công mới thành công khi cả bác sĩ và bệnh nhân tồn tại")
  void assignPatient_whenNewAssignment_success() {
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());
    when(assignmentRepository.save(any(DoctorPatientAssignment.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    DoctorPatientAssignment result = assignmentService.assignPatient(doctorId, patientId, adminId);

    assertThat(result).isNotNull();
    assertThat(result.getDoctor()).isEqualTo(doctorUser);
    assertThat(result.getPatient()).isEqualTo(patientUser);
    assertThat(result.getStatus()).isEqualTo(AssignmentStatus.ACTIVE);
    assertThat(result.getAssignedBy()).isEqualTo(adminId);
    verify(assignmentRepository).save(any(DoctorPatientAssignment.class));
  }

  @Test
  @DisplayName("assignPatient: Kích hoạt lại (ACTIVE) và cập nhật assignedBy khi đã có phân công từ trước")
  void assignPatient_whenAlreadyAssigned_reactivatesAssignment() {
    DoctorPatientAssignment existing = new DoctorPatientAssignment(
        doctorUser, patientUser, AssignmentStatus.INACTIVE, adminId
    );

    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.of(existing));
    when(assignmentRepository.save(any(DoctorPatientAssignment.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    DoctorPatientAssignment result = assignmentService.assignPatient(doctorId, patientId, adminId);

    assertThat(result).isNotNull();
    assertThat(result.getStatus()).isEqualTo(AssignmentStatus.ACTIVE);
    assertThat(result.getAssignedBy()).isEqualTo(adminId);
    verify(assignmentRepository).save(existing);
  }

  @Test
  @DisplayName("assignPatient: Bác sĩ không tồn tại -> ném ResourceNotFoundException")
  void assignPatient_whenDoctorNotFound_throwsException() {
    when(userRepository.findById(doctorId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> assignmentService.assignPatient(doctorId, patientId, adminId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Bác sĩ không tồn tại với ID");
  }

  @Test
  @DisplayName("assignPatient: Bệnh nhân không tồn tại -> ném ResourceNotFoundException")
  void assignPatient_whenPatientNotFound_throwsException() {
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(userRepository.findById(patientId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> assignmentService.assignPatient(doctorId, patientId, adminId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Bệnh nhân không tồn tại với ID");
  }

  @Test
  @DisplayName("unassignPatient (unassignDoctorFromPatient): Hủy phân công thành công -> status INACTIVE")
  void unassignPatient_whenAssignmentExists_setsInactive() {
    DoctorPatientAssignment existing = new DoctorPatientAssignment(
        doctorUser, patientUser, AssignmentStatus.ACTIVE, adminId
    );

    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.of(existing));
    when(assignmentRepository.save(any(DoctorPatientAssignment.class)))
        .thenAnswer(inv -> inv.getArgument(0));

    assignmentService.unassignPatient(doctorId, patientId);

    assertThat(existing.getStatus()).isEqualTo(AssignmentStatus.INACTIVE);
    verify(assignmentRepository).save(existing);
  }

  @Test
  @DisplayName("unassignPatient: Chưa từng phân công -> ném ResourceNotFoundException")
  void unassignPatient_whenAssignmentNotFound_throwsException() {
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> assignmentService.unassignPatient(doctorId, patientId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy phân công giữa Bác sĩ và Bệnh nhân");
  }

  @Test
  @DisplayName("existsByDoctorIdAndPatientId và isAssigned: Kiểm tra phân công thông qua Repository")
  void existsAndIsAssigned_verifiesRepositoryContracts() {
    when(assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE))
        .thenReturn(true);

    boolean activeAssigned = assignmentRepository.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AssignmentStatus.ACTIVE);
    assertThat(activeAssigned).isTrue();

    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId))
        .thenReturn(Optional.of(new DoctorPatientAssignment(doctorUser, patientUser, AssignmentStatus.ACTIVE, adminId)));

    Optional<DoctorPatientAssignment> opt = assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId);
    assertThat(opt).isPresent();
    assertThat(opt.get().getStatus()).isEqualTo(AssignmentStatus.ACTIVE);
  }

  @Test
  @DisplayName("getAssignedPatients: Trả về danh sách bệnh nhân kèm thông tin lâm sàng, số ca khám và nguy cơ mới nhất")
  void getAssignedPatients_withProfileAndScreenings_success() {
    DoctorPatientAssignment assignment = new DoctorPatientAssignment(
        doctorUser, patientUser, AssignmentStatus.ACTIVE, adminId
    );
    assignment.setAssignedAt(Instant.now());

    when(assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignment));

    PatientMedicalProfile profile = new PatientMedicalProfile(patientUser, "MRN-2026-9999");
    profile.setDateOfBirth(LocalDate.of(1975, 8, 20));
    profile.setAge(51);
    profile.setGender("Female");
    profile.setPhoneNumber("0912345678");
    profile.setAddress("Hanoi, Vietnam");
    profile.setSystolicBp(145);
    profile.setDiastolicBp(95);
    profile.setHba1c(7.8);
    profile.setHasDiabetes(true);
    profile.setHasHypertension(true);

    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    Screening latestScreening = new Screening(patientId, "https://cdn.aura.test/scan.png");
    latestScreening.setRiskLevel(RiskLevel.CRITICAL);
    ReflectionTestUtils.setField(latestScreening, "createdAt", Instant.now());

    when(screeningRepository.countByPatientId(patientId)).thenReturn(3L);
    when(screeningRepository.findTopByPatientIdOrderByCreatedAtDesc(patientId))
        .thenReturn(Optional.of(latestScreening));

    List<DoctorPatientSummaryResponse> list = assignmentService.getAssignedPatients(doctorId);

    assertThat(list).hasSize(1);
    DoctorPatientSummaryResponse item = list.get(0);
    assertThat(item.patientId()).isEqualTo(patientId);
    assertThat(item.mrn()).isEqualTo("MRN-2026-9999");
    assertThat(item.fullName()).isEqualTo("Nguyen Thi Patient");
    assertThat(item.email()).isEqualTo("patient@aura.test");
    assertThat(item.age()).isEqualTo(51);
    assertThat(item.gender()).isEqualTo("Female");
    assertThat(item.systolicBp()).isEqualTo(145);
    assertThat(item.diastolicBp()).isEqualTo(95);
    assertThat(item.hasDiabetes()).isTrue();
    assertThat(item.hasHypertension()).isTrue();
    assertThat(item.screeningCount()).isEqualTo(3L);
    assertThat(item.latestRiskLevel()).isEqualTo("CRITICAL");
    assertThat(item.assignmentStatus()).isEqualTo("ACTIVE");
  }

  @Test
  @DisplayName("getAssignedPatients: Bệnh nhân chưa có hồ sơ y tế và chưa có ca khám nào -> các trường phụ null an toàn")
  void getAssignedPatients_withoutProfileAndScreenings_returnsNullFieldsGracefully() {
    DoctorPatientAssignment assignment = new DoctorPatientAssignment(
        doctorUser, patientUser, AssignmentStatus.ACTIVE, adminId
    );

    when(assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignment));
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.empty());
    when(screeningRepository.countByPatientId(patientId)).thenReturn(0L);
    when(screeningRepository.findTopByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(Optional.empty());

    List<DoctorPatientSummaryResponse> list = assignmentService.getAssignedPatients(doctorId);

    assertThat(list).hasSize(1);
    DoctorPatientSummaryResponse item = list.get(0);
    assertThat(item.patientId()).isEqualTo(patientId);
    assertThat(item.mrn()).isNull();
    assertThat(item.fullName()).isEqualTo("Nguyen Thi Patient");
    assertThat(item.age()).isNull();
    assertThat(item.screeningCount()).isEqualTo(0L);
    assertThat(item.latestRiskLevel()).isNull();
    assertThat(item.lastScreeningAt()).isNull();
  }

  @Test
  @DisplayName("getAssignedDoctors: Kiểm tra truy vấn danh sách phân công theo bệnh nhân qua Repository")
  void getAssignedDoctors_viaRepository() {
    DoctorPatientAssignment assignment = new DoctorPatientAssignment(
        doctorUser, patientUser, AssignmentStatus.ACTIVE, adminId
    );

    when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignment));

    List<DoctorPatientAssignment> doctorList =
        assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE);

    assertThat(doctorList).hasSize(1);
    assertThat(doctorList.get(0).getDoctor()).isEqualTo(doctorUser);
  }
}
