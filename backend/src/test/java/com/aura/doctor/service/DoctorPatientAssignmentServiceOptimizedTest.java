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
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
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
@DisplayName("DoctorPatientAssignmentService - Optimized Patient Profile & Null User Edge Cases")
class DoctorPatientAssignmentServiceOptimizedTest {

  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private PatientMedicalProfileRepository profileRepository;
  @Mock private PatientProfileService profileService;
  @Mock private ScreeningRepository screeningRepository;
  @Mock private UserRepository userRepository;

  private DoctorPatientAssignmentService service;
  private UUID doctorId;
  private UUID patientId;
  private UUID adminId;
  private User doctorUser;
  private User patientUser;

  @BeforeEach
  void setUp() {
    service = new DoctorPatientAssignmentService(
        assignmentRepository,
        profileRepository,
        profileService,
        screeningRepository,
        userRepository
    );

    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    adminId = UUID.randomUUID();

    doctorUser = new User("doctor.opt@aura.hospital", "pwd_hash", "Dr. Optimized");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    patientUser = new User("patient.opt@aura.hospital", "pwd_hash", "Patient Optimized");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
  }

  @Test
  @DisplayName("getAssignedPatients: Xử lý an toàn khi bệnh nhân không có hồ sơ y tế (profile == null)")
  void testGetAssignedPatientsWhenProfileIsNull() {
    DoctorPatientAssignment assignment =
        new DoctorPatientAssignment(doctorUser, patientUser, AssignmentStatus.ACTIVE, adminId);
    assignment.setAssignedAt(Instant.now());

    when(assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignment));
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.empty());
    when(screeningRepository.countByPatientId(patientId)).thenReturn(0L);
    when(screeningRepository.findTopByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(Optional.empty());

    List<DoctorPatientSummaryResponse> list = service.getAssignedPatients(doctorId);

    assertThat(list).hasSize(1);
    DoctorPatientSummaryResponse summary = list.get(0);
    assertThat(summary.patientId()).isEqualTo(patientId);
    assertThat(summary.mrn()).isNull();
    assertThat(summary.fullName()).isEqualTo("Patient Optimized");
    assertThat(summary.email()).isEqualTo("patient.opt@aura.hospital");
    assertThat(summary.latestRiskLevel()).isNull();
    assertThat(summary.screeningCount()).isEqualTo(0L);
  }

  @Test
  @DisplayName("getAssignedPatients: Bệnh nhân có profile nhưng User bị null fullName và email")
  void testGetAssignedPatientsWhenUserHasNullFullNameAndEmail() {
    User nullFieldsUser = new User(null, "hash", null);
    ReflectionTestUtils.setField(nullFieldsUser, "id", patientId);

    DoctorPatientAssignment assignment =
        new DoctorPatientAssignment(doctorUser, nullFieldsUser, AssignmentStatus.ACTIVE, adminId);

    when(assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignment));

    PatientMedicalProfile profile = new PatientMedicalProfile(nullFieldsUser, "MRN-NULL-USER");
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));
    when(screeningRepository.countByPatientId(patientId)).thenReturn(0L);
    when(screeningRepository.findTopByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(Optional.empty());

    List<DoctorPatientSummaryResponse> list = service.getAssignedPatients(doctorId);

    assertThat(list).hasSize(1);
    DoctorPatientSummaryResponse summary = list.get(0);
    assertThat(summary.mrn()).isEqualTo("MRN-NULL-USER");
    assertThat(summary.fullName()).isNull();
    assertThat(summary.email()).isNull();
  }

  @Test
  @DisplayName("getAssignedPatients: Ưu tiên lấy fullName từ profile.getUser() khi có giá trị")
  void testGetAssignedPatientsPrefersProfileUserFullName() {
    User profileUser = new User("prof@aura.ai", "hash", "Profile Full Name");
    ReflectionTestUtils.setField(profileUser, "id", patientId);

    User directUser = new User("direct@aura.ai", "hash", "Direct Full Name");
    ReflectionTestUtils.setField(directUser, "id", patientId);

    DoctorPatientAssignment assignment =
        new DoctorPatientAssignment(doctorUser, directUser, AssignmentStatus.ACTIVE, adminId);

    when(assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignment));

    PatientMedicalProfile profile = new PatientMedicalProfile(profileUser, "MRN-PROF-NAME");
    when(profileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    Screening screening = new Screening(patientId, "http://image.url");
    screening.setRiskLevel(RiskLevel.HIGH);
    ReflectionTestUtils.setField(screening, "createdAt", Instant.now());

    when(screeningRepository.countByPatientId(patientId)).thenReturn(2L);
    when(screeningRepository.findTopByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(Optional.of(screening));

    List<DoctorPatientSummaryResponse> list = service.getAssignedPatients(doctorId);

    assertThat(list).hasSize(1);
    DoctorPatientSummaryResponse summary = list.get(0);
    assertThat(summary.fullName()).isEqualTo("Profile Full Name");
    assertThat(summary.latestRiskLevel()).isEqualTo("HIGH");
    assertThat(summary.screeningCount()).isEqualTo(2L);
  }

  @Test
  @DisplayName("assignPatient: Ném ResourceNotFoundException khi doctorId hoặc patientId không tồn tại")
  void testAssignPatientNotFoundThrowsException() {
    when(userRepository.findById(doctorId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.assignPatient(doctorId, patientId, adminId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Bác sĩ không tồn tại");

    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(userRepository.findById(patientId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.assignPatient(doctorId, patientId, adminId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Bệnh nhân không tồn tại");
  }

  @Test
  @DisplayName("unassignPatient: Ném ResourceNotFoundException khi không tìm thấy phân công")
  void testUnassignPatientNotFoundThrowsException() {
    when(assignmentRepository.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.unassignPatient(doctorId, patientId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy phân công giữa Bác sĩ và Bệnh nhân");
  }
}
