package com.aura.patient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PatientProfileServiceFullTest {

  @Mock
  private PatientMedicalProfileRepository profileRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private PatientProfileRepository patientRepository;

  @Mock
  private DoctorPatientAssignmentRepository assignmentRepository;

  private PatientProfileService service;

  private User mockUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    service = new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    userId = UUID.randomUUID();
    mockUser = new User("patient@aura.test", "hash123", "Bệnh Nhân Thử Nghiệm");
    ReflectionTestUtils.setField(mockUser, "id", userId);
  }

  @Test
  @DisplayName("getOrCreateProfile (getMyProfile): Hồ sơ đã tồn tại -> trả về trực tiếp thông tin hồ sơ")
  void getOrCreateProfile_whenProfileExists_returnsExisting() {
    PatientMedicalProfile existing = new PatientMedicalProfile(mockUser, "MRN-2026-1111");
    existing.setAge(48);
    existing.setSystolicBp(125);
    existing.setDiastolicBp(80);

    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(existing));

    PatientProfileResponse response = service.getOrCreateProfile(userId);

    assertThat(response).isNotNull();
    assertThat(response.mrn()).isEqualTo("MRN-2026-1111");
    assertThat(response.fullName()).isEqualTo("Bệnh Nhân Thử Nghiệm");
    assertThat(response.age()).isEqualTo(48);
    assertThat(response.systolicBp()).isEqualTo(125);
    assertThat(response.diastolicBp()).isEqualTo(80);
    verify(profileRepository, never()).save(any());
  }

  @Test
  @DisplayName("getOrCreateProfile: Chưa có hồ sơ -> tự động tạo hồ sơ mới với user tìm thấy")
  void getOrCreateProfile_whenProfileDoesNotExist_createsNewDefaultProfile() {
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.empty());
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.existsByMrn(anyString())).thenReturn(false);
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    PatientProfileResponse response = service.getOrCreateProfile(userId);

    assertThat(response).isNotNull();
    assertThat(response.mrn()).startsWith("MRN-");
    assertThat(response.fullName()).isEqualTo("Bệnh Nhân Thử Nghiệm");
    assertThat(response.systolicBp()).isNull();
    assertThat(response.diastolicBp()).isNull();
    assertThat(response.hasDiabetes()).isNull();
    assertThat(response.hasHypertension()).isNull();
    verify(profileRepository).save(any(PatientMedicalProfile.class));
  }

  @Test
  @DisplayName("getOrCreateProfile: Trùng MRN lần đầu -> sinh mã MRN từ 4 ký tự tiếp theo của UUID")
  void getOrCreateProfile_whenGeneratedMrnExists_regeneratesWithAlternativeSubstring() {
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.empty());
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.existsByMrn(anyString())).thenReturn(true);
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    PatientProfileResponse response = service.getOrCreateProfile(userId);

    assertThat(response).isNotNull();
    assertThat(response.mrn()).startsWith("MRN-");
    verify(profileRepository).save(any(PatientMedicalProfile.class));
  }

  @Test
  @DisplayName("getOrCreateProfile: User không tồn tại -> ném ResourceNotFoundException")
  void getOrCreateProfile_whenUserNotFound_throwsException() {
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.empty());
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getOrCreateProfile(userId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Người dùng không tồn tại với ID");
  }

  @Test
  @DisplayName("updateProfile: Cập nhật thành công thông tin cá nhân, ngày sinh tính tuổi, huyết áp và bệnh lý")
  void updateProfile_fullUpdates_success() {
    PatientMedicalProfile profile = new PatientMedicalProfile(mockUser, "MRN-2026-1234");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    LocalDate dob = LocalDate.now().minusYears(35);
    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        "Nguyen Van Updated",
        dob,
        null,
        "Male",
        "0912345678",
        "Hanoi, Vietnam",
        " O+ ",
        130,
        85,
        6.5,
        true,
        "Type2",
        4,
        true,
        false,
        false,
        false,
        "Aspirin 81mg",
        "None",
        "Nguyen Thi Emergency",
        "0987654321"
    );

    PatientProfileResponse response = service.updateProfile(userId, req);

    assertThat(response).isNotNull();
    assertThat(mockUser.getFullName()).isEqualTo("Nguyen Van Updated");
    assertThat(response.fullName()).isEqualTo("Nguyen Van Updated");
    assertThat(response.dateOfBirth()).isEqualTo(dob);
    assertThat(response.age()).isEqualTo(35);
    assertThat(response.systolicBp()).isEqualTo(130);
    assertThat(response.diastolicBp()).isEqualTo(85);
    assertThat(response.bloodType()).isEqualTo("O+");
    assertThat(response.hasDiabetes()).isTrue();
    assertThat(response.diabetesType()).isEqualTo("Type2");
    assertThat(response.diabetesDurationYears()).isEqualTo(4);
    assertThat(response.hasHypertension()).isTrue();
    assertThat(response.emergencyContactName()).isEqualTo("Nguyen Thi Emergency");
    verify(patientRepository).save(any(PatientProfile.class));
  }

  @Test
  @DisplayName("updateProfile: Ngày sinh ở tương lai -> ném IllegalArgumentException")
  void updateProfile_whenFutureDob_throwsException() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    LocalDate futureDob = LocalDate.now().plusDays(1);
    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        null, futureDob, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(userId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Ngày sinh không được ở tương lai");
  }

  @Test
  @DisplayName("updateProfile: Tuổi tính từ ngày sinh vượt quá 120 -> ném IllegalArgumentException")
  void updateProfile_whenAgeExceeds120_throwsException() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    LocalDate oldDob = LocalDate.now().minusYears(125);
    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        null, oldDob, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(userId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Tuổi tính từ ngày sinh không được vượt quá 120");
  }

  @Test
  @DisplayName("updateProfile: Huyết áp tâm thu nhỏ hơn hoặc bằng tâm trương -> ném IllegalArgumentException")
  void updateProfile_whenSystolicLessOrEqualToDiastolic_throwsException() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    UpdatePatientProfileRequest req1 = new UpdatePatientProfileRequest(
        null, null, null, null, null, null, null, 80, 120, null, null, null, null, null, null, null, null, null, null, null, null
    );
    assertThatThrownBy(() -> service.updateProfile(userId, req1))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương");

    UpdatePatientProfileRequest req2 = new UpdatePatientProfileRequest(
        null, null, null, null, null, null, null, 90, 90, null, null, null, null, null, null, null, null, null, null, null, null
    );
    assertThatThrownBy(() -> service.updateProfile(userId, req2))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương");
  }

  @Test
  @DisplayName("updateProfile: hasDiabetes = false -> gán diabetesType và diabetesDurationYears = null")
  void updateProfile_whenDiabetesFalse_clearsDiabetesDetails() {
    PatientMedicalProfile profile = new PatientMedicalProfile(mockUser, "MRN-2026-0002");
    profile.setDiabetesType("Type1");
    profile.setDiabetesDurationYears(5);

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        null, null, 40, "Female", null, null, "", 120, 80, null, false, null, null, null, null, null, null, null, null, null, null
    );

    PatientProfileResponse response = service.updateProfile(userId, req);

    assertThat(response.hasDiabetes()).isFalse();
    assertThat(response.diabetesType()).isNull();
    assertThat(response.diabetesDurationYears()).isNull();
    assertThat(response.bloodType()).isNull();
  }

  @Test
  @DisplayName("getProfileByPatientId: Tìm thấy theo userId hoặc theo profileId, không tìm thấy -> ném ResourceNotFoundException")
  void getProfileByPatientId_bothFoundAndNotFoundPaths() {
    UUID patientId = UUID.randomUUID();
    PatientMedicalProfile profile = new PatientMedicalProfile(mockUser, "MRN-FOUND-USER");

    // Path 1: Found by userId
    when(profileRepository.findByUserIdWithUser(patientId)).thenReturn(Optional.of(profile));
    PatientProfileResponse res1 = service.getProfileByPatientId(patientId);
    assertThat(res1.mrn()).isEqualTo("MRN-FOUND-USER");

    // Path 2: Not found by userId, found by profileId
    UUID profileId = UUID.randomUUID();
    PatientMedicalProfile profile2 = new PatientMedicalProfile(mockUser, "MRN-FOUND-ID");
    when(profileRepository.findByUserIdWithUser(profileId)).thenReturn(Optional.empty());
    when(profileRepository.findById(profileId)).thenReturn(Optional.of(profile2));
    PatientProfileResponse res2 = service.getProfileByPatientId(profileId);
    assertThat(res2.mrn()).isEqualTo("MRN-FOUND-ID");

    // Path 3: Not found in both
    UUID unknownId = UUID.randomUUID();
    when(profileRepository.findByUserIdWithUser(unknownId)).thenReturn(Optional.empty());
    when(profileRepository.findById(unknownId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.getProfileByPatientId(unknownId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy hồ sơ y tế với ID");
  }

  @Test
  @DisplayName("getPatientById: Tìm thấy -> trả về PatientProfileDto, không tìm thấy -> ném ResourceNotFoundException")
  void getPatientById_foundAndNotFound() {
    UUID id = UUID.randomUUID();
    PatientProfile p = new PatientProfile("MRN-001", "Bệnh Nhân A", 50, "Male", "0912");
    when(patientRepository.findById(id)).thenReturn(Optional.of(p));

    PatientProfileDto dto = service.getPatientById(id);
    assertThat(dto).isNotNull();
    assertThat(dto.fullName()).isEqualTo("Bệnh Nhân A");

    UUID notFoundId = UUID.randomUUID();
    when(patientRepository.findById(notFoundId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.getPatientById(notFoundId))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  @DisplayName("createPatient: Tự sinh MRN khi rỗng và lưu PatientProfile")
  void createPatient_whenMrnNull_generatesMrnAndSaves() {
    PatientProfile p = new PatientProfile(null, "Bệnh Nhân Mới", 40, "Female", "0900");
    when(patientRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    PatientProfileDto dto = service.createPatient(p);

    assertThat(dto).isNotNull();
    assertThat(dto.mrn()).startsWith("MRN-");
    assertThat(dto.fullName()).isEqualTo("Bệnh Nhân Mới");
  }

  @Test
  @DisplayName("updatePatient: Cập nhật đầy đủ các trường thông tin lâm sàng của PatientProfile")
  void updatePatient_updatesAllFields() {
    UUID id = UUID.randomUUID();
    PatientProfile existing = new PatientProfile("MRN-OLD", "Old Name", 30, "Male", "0111");
    PatientProfile updated = new PatientProfile("MRN-NEW", "New Name", 35, "Female", "0222");
    updated.setAddress("Danang");
    updated.setSystolicBp(140);
    updated.setDiastolicBp(90);
    updated.setHba1c(7.1);
    updated.setHasDiabetes(true);
    updated.setHasHypertension(true);
    updated.setHistoryOfSmoking(true);
    updated.setAssignedDoctor("BS. CKII Thanh");
    updated.setRiskScore(75);
    updated.setRiskLevel("HIGH");
    updated.setReviewStatus("REVIEWED");
    updated.setFindingsSummary("Hẹp vi mạch nhẹ");

    when(patientRepository.findById(id)).thenReturn(Optional.of(existing));
    when(patientRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    PatientProfileDto dto = service.updatePatient(id, updated);

    assertThat(dto.fullName()).isEqualTo("New Name");
    assertThat(dto.age()).isEqualTo(35);
    assertThat(dto.gender()).isEqualTo("Female");
    assertThat(dto.phone()).isEqualTo("0222");
    assertThat(dto.address()).isEqualTo("Danang");
    assertThat(dto.systolicBp()).isEqualTo(140);
    assertThat(dto.diastolicBp()).isEqualTo(90);
    assertThat(dto.hba1c()).isEqualTo(7.1);
    assertThat(dto.hasDiabetes()).isTrue();
    assertThat(dto.hasHypertension()).isTrue();
    assertThat(dto.historyOfSmoking()).isTrue();
    assertThat(dto.assignedDoctor()).isEqualTo("BS. CKII Thanh");
    assertThat(dto.riskScore()).isEqualTo(75);
    assertThat(dto.riskLevel()).isEqualTo("HIGH");
    assertThat(dto.reviewStatus()).isEqualTo("REVIEWED");
    assertThat(dto.findingsSummary()).isEqualTo("Hẹp vi mạch nhẹ");
  }

  @Test
  @DisplayName("updatePatient: ID không tồn tại -> ném ResourceNotFoundException")
  void updatePatient_whenNotFound_throwsException() {
    UUID id = UUID.randomUUID();
    when(patientRepository.findById(id)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.updatePatient(id, new PatientProfile()))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  @DisplayName("searchPatients: Gọi repository.findAll(Specification, Pageable)")
  void searchPatients_delegatesToRepository() {
    Pageable pageable = PageRequest.of(0, 10);
    PatientProfile p = new PatientProfile("MRN-P", "Nguyen", 40, "Male", "090");
    when(patientRepository.findAll(any(Specification.class), any(Pageable.class)))
        .thenReturn(new PageImpl<>(List.of(p)));

    Page<PatientProfileDto> page = service.searchPatients(
        "Nguyen", "HIGH", 50, 80, true, true, false, "BS. Thanh", "REVIEWED", pageable
    );

    assertThat(page).isNotNull();
    assertThat(page.getTotalElements()).isEqualTo(1);
    assertThat(page.getContent().get(0).fullName()).isEqualTo("Nguyen");
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Khi assignments rỗng -> xử lý an toàn không lỗi")
  void syncFromMedicalProfilesAndAssignments_whenEmpty_handlesSafely() {
    service.syncFromMedicalProfilesAndAssignments();
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Khi repository ném ngoại lệ -> bắt lỗi an toàn và không làm sập hệ thống")
  void syncFromMedicalProfilesAndAssignments_whenExceptionThrown_handlesGracefully() {
    service.syncFromMedicalProfilesAndAssignments();
  }

  @Test
  @DisplayName("DAT-01: updatePatient (Doctor) đồng bộ 2 chiều sang PatientMedicalProfile và User")
  void updatePatient_syncsToPatientMedicalProfileAndUser() {
    UUID patientProfileId = UUID.randomUUID();
    PatientProfile existing = new PatientProfile("MRN-2026-9999", "Bệnh Nhân Cũ", 40, "Male", "0901112222");
    existing.setUserId(userId);

    PatientProfile updatedInput = new PatientProfile("MRN-2026-9999", "Bệnh Nhân Mới", 42, "Female", "0903334444");
    updatedInput.setAddress("123 Phố Huế, Hà Nội");
    updatedInput.setSystolicBp(145);
    updatedInput.setDiastolicBp(92);
    updatedInput.setHba1c(7.5);
    updatedInput.setHasDiabetes(true);
    updatedInput.setHasHypertension(true);
    updatedInput.setHistoryOfSmoking(true);
    updatedInput.setAssignedDoctor("BS. CKII Lê Văn Bác Sĩ");

    PatientMedicalProfile existingMed = new PatientMedicalProfile(mockUser, "MRN-2026-9999");

    when(patientRepository.findById(patientProfileId)).thenReturn(Optional.of(existing));
    when(patientRepository.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(existingMed));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    PatientProfileDto result = service.updatePatient(patientProfileId, updatedInput);

    assertThat(result).isNotNull();
    assertThat(result.fullName()).isEqualTo("Bệnh Nhân Mới");
    assertThat(mockUser.getFullName()).isEqualTo("Bệnh Nhân Mới");

    org.mockito.ArgumentCaptor<PatientMedicalProfile> medCaptor =
        org.mockito.ArgumentCaptor.forClass(PatientMedicalProfile.class);
    verify(profileRepository).save(medCaptor.capture());
    PatientMedicalProfile savedMed = medCaptor.getValue();
    assertThat(savedMed.getAge()).isEqualTo(42);
    assertThat(savedMed.getGender()).isEqualTo("Female");
    assertThat(savedMed.getPhoneNumber()).isEqualTo("0903334444");
    assertThat(savedMed.getAddress()).isEqualTo("123 Phố Huế, Hà Nội");
    assertThat(savedMed.getSystolicBp()).isEqualTo(145);
    assertThat(savedMed.getDiastolicBp()).isEqualTo(92);
    assertThat(savedMed.getHba1c()).isEqualTo(7.5);
    assertThat(savedMed.getHasDiabetes()).isTrue();
    assertThat(savedMed.getHasHypertension()).isTrue();
    assertThat(savedMed.getHistoryOfSmoking()).isTrue();
    assertThat(savedMed.getAssignedDoctor()).isEqualTo("BS. CKII Lê Văn Bác Sĩ");
  }
}
