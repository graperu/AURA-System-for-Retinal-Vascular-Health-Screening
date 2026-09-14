package com.aura.clinic.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.entity.ClinicMemberStatus;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.clinic.repository.ClinicProfileRepository;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClinicMemberService - Optimized FR-22/FR-23 Verification & Assignment Unit Tests")
class ClinicMemberServiceOptimizedTest {

  @Mock private ClinicMemberRepository clinicMemberRepository;
  @Mock private ClinicProfileRepository clinicProfileRepository;
  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private DoctorPatientAssignmentService assignmentService;

  private ClinicMemberService service;
  private UUID clinicId;
  private UUID doctorId;
  private UUID patientId;
  private User clinicUser;
  private User doctorUser;

  @BeforeEach
  void setUp() {
    service = new ClinicMemberService(
        clinicMemberRepository,
        clinicProfileRepository,
        userRepository,
        userRoleRepository,
        assignmentService
    );
    clinicId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();

    clinicUser = new User("clinic@aura.test", "hash", "Phong Kham AURA");
    ReflectionTestUtils.setField(clinicUser, "id", clinicId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. Nguyen Van Doc");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);
  }

  @Test
  @DisplayName("getMembers: Lấy danh sách thành viên bác sĩ theo clinicId")
  void testGetMembersByClinicId() {
    ClinicMember m1 = new ClinicMember(clinicUser, doctorUser);
    when(clinicMemberRepository.findByClinicId(clinicId)).thenReturn(List.of(m1));

    List<ClinicMember> members = service.getMembers(clinicId);

    assertThat(members).hasSize(1);
    assertThat(members.get(0).getDoctor()).isEqualTo(doctorUser);
    verify(clinicMemberRepository).findByClinicId(clinicId);
  }

  @Test
  @DisplayName("Chặn thêm member: Khi phòng khám chưa nộp hồ sơ (profile không tồn tại) -> ném IllegalArgumentException")
  void testAddDoctorWhenClinicProfileNotFoundThrows() {
    when(clinicProfileRepository.findByUserId(clinicId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.addDoctor(clinicId, "doctor@aura.test"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Phòng khám chưa nộp hồ sơ đăng ký tổ chức (FR-22)");
    verify(userRepository, never()).findById(any());
  }

  @ParameterizedTest(name = "Block unverified clinic: status={0}")
  @EnumSource(value = VerificationStatus.class, names = {"PENDING", "REJECTED"})
  @DisplayName("Chặn thêm member: Khi phòng khám chưa APPROVED (PENDING hoặc REJECTED) -> ném IllegalArgumentException")
  void testAddDoctorWhenClinicNotApprovedThrows(VerificationStatus unapprovedStatus) {
    ClinicProfile profile = new ClinicProfile(clinicUser, "Phong Kham AURA", "GP-01", "http://gp.pdf");
    profile.setVerificationStatus(unapprovedStatus);
    when(clinicProfileRepository.findByUserId(clinicId)).thenReturn(Optional.of(profile));

    assertThatThrownBy(() -> service.addDoctor(clinicId, "doctor@aura.test"))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Phòng khám chưa được Admin xác minh")
        .hasMessageContaining(unapprovedStatus.name());
    verify(userRepository, never()).findById(any());
  }

  @Test
  @DisplayName("Hủy phân công bệnh nhân: Khi doctor không thuộc phòng khám (không tìm thấy trong repo) -> ném ngoại lệ")
  void testUnassignPatientWhenDoctorNotInClinicThrows() {
    ClinicProfile profile = new ClinicProfile(clinicUser, "Phong Kham AURA", "GP-01", "http://gp.pdf");
    profile.setVerificationStatus(VerificationStatus.APPROVED);
    when(clinicProfileRepository.findByUserId(clinicId)).thenReturn(Optional.of(profile));

    when(clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.unassignPatientFromOwnDoctor(clinicId, doctorId, patientId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Bác sĩ được chỉ định không thuộc phòng khám của bạn hoặc đã bị gỡ");
    verify(assignmentService, never()).unassignPatient(any(), any());
  }

  @Test
  @DisplayName("Hủy phân công bệnh nhân: Khi doctor thuộc phòng khám nhưng status = REVOKED -> ném ngoại lệ")
  void testUnassignPatientWhenDoctorStatusRevokedThrows() {
    ClinicProfile profile = new ClinicProfile(clinicUser, "Phong Kham AURA", "GP-01", "http://gp.pdf");
    profile.setVerificationStatus(VerificationStatus.APPROVED);
    when(clinicProfileRepository.findByUserId(clinicId)).thenReturn(Optional.of(profile));

    ClinicMember revokedMember = new ClinicMember(clinicUser, doctorUser);
    revokedMember.setStatus(ClinicMemberStatus.REVOKED);
    when(clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.of(revokedMember));

    assertThatThrownBy(() -> service.unassignPatientFromOwnDoctor(clinicId, doctorId, patientId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Bác sĩ được chỉ định không thuộc phòng khám của bạn hoặc đã bị gỡ");
    verify(assignmentService, never()).unassignPatient(any(), any());
  }

  @Test
  @DisplayName("Hủy phân công bệnh nhân: Khi doctor thuộc phòng khám và status = ACTIVE -> hủy phân công thành công")
  void testUnassignPatientWhenDoctorIsActiveSuccess() {
    ClinicProfile profile = new ClinicProfile(clinicUser, "Phong Kham AURA", "GP-01", "http://gp.pdf");
    profile.setVerificationStatus(VerificationStatus.APPROVED);
    when(clinicProfileRepository.findByUserId(clinicId)).thenReturn(Optional.of(profile));

    ClinicMember activeMember = new ClinicMember(clinicUser, doctorUser);
    activeMember.setStatus(ClinicMemberStatus.ACTIVE);
    when(clinicMemberRepository.findByClinicIdAndDoctorId(clinicId, doctorId)).thenReturn(Optional.of(activeMember));

    service.unassignPatientFromOwnDoctor(clinicId, doctorId, patientId);

    verify(assignmentService).unassignPatient(doctorId, patientId);
  }
}
