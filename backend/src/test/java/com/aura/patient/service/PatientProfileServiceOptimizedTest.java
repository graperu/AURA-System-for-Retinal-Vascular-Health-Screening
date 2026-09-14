package com.aura.patient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientProfileService - Optimized High Coverage Unit Tests")
class PatientProfileServiceOptimizedTest {

  @Mock private PatientMedicalProfileRepository profileRepository;
  @Mock private UserRepository userRepository;
  @Mock private PatientProfileRepository patientRepository;
  @Mock private DoctorPatientAssignmentRepository assignmentRepository;

  @Test
  @DisplayName("Constructor 2 tham số khởi tạo hợp lệ với null repos và getPatientsForDoctor fallback an toàn")
  void testTwoArgConstructorAndGetPatientsForDoctorFallback() {
    PatientProfileService twoArgService = new PatientProfileService(profileRepository, userRepository);
    UUID doctorId = UUID.randomUUID();

    List<PatientProfileResponse> patients = twoArgService.getPatientsForDoctor(doctorId);

    assertThat(patients).isNotNull().isEmpty();
  }

  @Test
  @DisplayName("getPatientsForDoctor: Khi có assignments active -> map đầy đủ DTO và bỏ qua record profile null")
  void testGetPatientsForDoctorWithActiveAssignmentsAndNullFilter() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID doctorId = UUID.randomUUID();

    User doctorUser = new User("doctor@aura.test", "hash", "BS. Nguyen Van Doc");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    UUID patientId1 = UUID.randomUUID();
    User patientUser1 = new User("p1@aura.test", "hash", "Benh Nhan 1");
    ReflectionTestUtils.setField(patientUser1, "id", patientId1);

    UUID patientId2 = UUID.randomUUID();
    User patientUser2 = new User("p2@aura.test", "hash", "Benh Nhan 2");
    ReflectionTestUtils.setField(patientUser2, "id", patientId2);

    DoctorPatientAssignment a1 = new DoctorPatientAssignment(doctorUser, patientUser1, AssignmentStatus.ACTIVE, doctorId);
    DoctorPatientAssignment a2 = new DoctorPatientAssignment(doctorUser, patientUser2, AssignmentStatus.ACTIVE, doctorId);

    when(assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE)).thenReturn(List.of(a1, a2));

    PatientMedicalProfile med1 = new PatientMedicalProfile(patientUser1, "MRN-2026-0001");
    med1.setAge(45);
    when(profileRepository.findByUserIdWithUser(patientId1)).thenReturn(Optional.of(med1));
    when(profileRepository.findByUserIdWithUser(patientId2)).thenReturn(Optional.empty());

    List<PatientProfileResponse> responses = service.getPatientsForDoctor(doctorId);

    assertThat(responses).hasSize(1);
    assertThat(responses.get(0).mrn()).isEqualTo("MRN-2026-0001");
    assertThat(responses.get(0).assignedDoctor()).isEqualTo("BS. Nguyen Van Doc");
    assertThat(responses.get(0).assignedDoctorId()).isEqualTo(doctorId);
  }

  @ParameterizedTest(name = "Paradoxical blood pressure sys={0}, dia={1} must throw IllegalArgumentException")
  @CsvSource({
    "120, 120",
    "110, 120",
    "70, 80",
    "80, 100",
    "0, 0",
    "95, 95",
    "60, 90"
  })
  @DisplayName("Huyết áp nghịch lý (sys <= dia) phải bị chặn với thông báo chính xác")
  void testParadoxicalBloodPressureThrows(int sys, int dia) {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User user = new User("patient@aura.test", "hash", "Nguyen Van A");
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, "O+",
        sys, dia, 5.5, false, null, null, false, false, false, false, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(userId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương");
    verify(profileRepository, never()).save(any());
  }

  @ParameterizedTest(name = "DiabetesType fallback: input=''{0}'', expected=''{1}'', durationInput={2}, expectedDuration={3}")
  @CsvSource({
    "'', 'Type2', , 0",
    "'   ', 'Type2', 3, 3",
    "'Type1', 'Type1', , 0",
    "'Gestational', 'Gestational', 2, 2"
  })
  @DisplayName("Fallback diabetesType khi hasDiabetes=true và diabetesType rỗng/trống hoặc duration null")
  void testDiabetesTypeFallbacksWhenHasDiabetesTrue(
      String inputDiabetesType, String expectedDiabetesType, Integer inputDuration, int expectedDuration) {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User user = new User("patient@aura.test", "hash", "Nguyen Van A");
    PatientMedicalProfile profile = new PatientMedicalProfile(user, "MRN-2026-9999");

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 35, "Male", null, null, "O+",
        125, 80, 6.5, true, inputDiabetesType, inputDuration, false, false, false, false, null, null, null, null
    );

    PatientProfileResponse res = service.updateProfile(userId, req);

    assertThat(res.hasDiabetes()).isTrue();
    assertThat(res.diabetesType()).isEqualTo(expectedDiabetesType);
    assertThat(res.diabetesDurationYears()).isEqualTo(expectedDuration);
  }

  @ParameterizedTest
  @NullAndEmptySource
  @ValueSource(strings = {"   "})
  @DisplayName("Fallback diabetesType khi input null/blank và hasDiabetes=true")
  void testDiabetesTypeNullAndBlankFallback(String blankType) {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User user = new User("patient@aura.test", "hash", "Nguyen Van A");
    PatientMedicalProfile profile = new PatientMedicalProfile(user, "MRN-2026-8888");

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 35, "Male", null, null, "O+",
        125, 80, 6.5, true, blankType, null, false, false, false, false, null, null, null, null
    );

    PatientProfileResponse res = service.updateProfile(userId, req);

    assertThat(res.hasDiabetes()).isTrue();
    assertThat(res.diabetesType()).isEqualTo("Type2");
    assertThat(res.diabetesDurationYears()).isEqualTo(0);
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Tạo mới PatientProfile, fallback tên, gender null -> 'Other', tiền sử null -> false, doctor null")
  void testSyncFromMedicalProfilesAndAssignmentsComprehensiveFallback() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    UUID patientId = UUID.randomUUID();
    User patientUser = new User("patient@aura.test", "hash", null); // User fullName null
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    // Doctor with null fullName
    DoctorPatientAssignment assignment = new DoctorPatientAssignment(null, patientUser, AssignmentStatus.ACTIVE, null);

    when(assignmentRepository.findAll()).thenReturn(List.of(assignment));

    // PatientMedicalProfile with med.getUser() returning null
    PatientMedicalProfile med = new PatientMedicalProfile(null, "MRN-TEST-SYNC");
    med.setUser(null); // triggers user null branch
    med.setGender(null); // triggers gender fallback -> "Other"
    med.setHasDiabetes(null); // triggers null fallback -> false
    med.setHasHypertension(null); // triggers null fallback -> false
    med.setHistoryOfSmoking(null); // triggers null fallback -> false

    when(profileRepository.findByUserIdWithUser(patientId)).thenReturn(Optional.of(med));
    when(patientRepository.findByUserId(patientId)).thenReturn(Optional.empty()); // create new profile branch

    service.syncFromMedicalProfilesAndAssignments();

    ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
    verify(patientRepository).save(captor.capture());

    PatientProfile saved = captor.getValue();
    assertThat(saved.getUserId()).isEqualTo(patientId);
    assertThat(saved.getMrn()).isEqualTo("MRN-TEST-SYNC");
    assertThat(saved.getFullName()).isEqualTo("Bệnh nhân"); // fallback to "Bệnh nhân"
    assertThat(saved.getGender()).isEqualTo("Other");
    assertThat(saved.getHasDiabetes()).isFalse();
    assertThat(saved.getHasHypertension()).isFalse();
    assertThat(saved.getHistoryOfSmoking()).isFalse();
    assertThat(saved.getAssignedDoctor()).isNull();
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Khi repository ném Exception -> bắt an toàn không văng lỗi")
  void testSyncFromMedicalProfilesAndAssignmentsCatchesExceptionGracefully() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    when(assignmentRepository.findAll()).thenThrow(new RuntimeException("PostgreSQL Connection Pool Exhausted"));

    // Should not throw exception
    service.syncFromMedicalProfilesAndAssignments();
    verify(patientRepository, never()).save(any());
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Khi repos null -> trả về sớm an toàn")
  void testSyncFromMedicalProfilesAndAssignmentsWithNullReposEarlyReturn() {
    PatientProfileService service = new PatientProfileService(profileRepository, userRepository);
    service.syncFromMedicalProfilesAndAssignments();
    verify(profileRepository, never()).findAll();
  }

  @Test
  @DisplayName("toResponse doctor null fallback: activeAssignment null, assignmentRepo null, hoặc doctor null")
  void testToResponseDoctorNullFallbacks() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User patientUser = new User("p@aura.test", "hash", "Benh Nhan Test");
    ReflectionTestUtils.setField(patientUser, "id", userId);

    PatientMedicalProfile profile = new PatientMedicalProfile(patientUser, "MRN-2026-DOCTOR-NULL");
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(assignmentRepository.findByPatientIdAndStatus(userId, AssignmentStatus.ACTIVE)).thenReturn(List.of());

    PatientProfileResponse res = service.getProfileByPatientId(userId);

    assertThat(res).isNotNull();
    assertThat(res.assignedDoctor()).isNull();
    assertThat(res.assignedDoctorId()).isNull();

    // Case: activeAssignment có nhưng getDoctor() == null
    DoctorPatientAssignment assignmentWithNullDoc = new DoctorPatientAssignment(null, patientUser, AssignmentStatus.ACTIVE, null);
    when(assignmentRepository.findByPatientIdAndStatus(userId, AssignmentStatus.ACTIVE)).thenReturn(List.of(assignmentWithNullDoc));
    PatientProfileResponse resNullDoc = service.getProfileByPatientId(userId);
    assertThat(resNullDoc.assignedDoctor()).isNull();
    assertThat(resNullDoc.assignedDoctorId()).isNull();

    // Case: profile.getUser() == null
    UUID docMedId = UUID.randomUUID();
    PatientMedicalProfile profileWithoutUser = new PatientMedicalProfile(null, "MRN-NO-USER");
    when(profileRepository.findByUserIdWithUser(docMedId)).thenReturn(Optional.empty());
    when(profileRepository.findById(docMedId)).thenReturn(Optional.of(profileWithoutUser));

    PatientProfileResponse resNoUser = service.getProfileByPatientId(docMedId);
    assertThat(resNoUser).isNotNull();
    assertThat(resNoUser.assignedDoctor()).isNull();
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Bỏ qua assignment mồ côi (patient null) và không có MedicalProfile")
  void testSyncFromMedicalProfilesOrphanAndMissingProfile() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    // Assignment 1: mồ côi (patient == null)
    DoctorPatientAssignment orphan = new DoctorPatientAssignment(null, null, AssignmentStatus.ACTIVE, null);

    // Assignment 2: có patient nhưng không có MedicalProfile
    UUID pId = UUID.randomUUID();
    User patient2 = new User("p2@aura.test", "pass", "Patient 2");
    ReflectionTestUtils.setField(patient2, "id", pId);
    DoctorPatientAssignment validPatientNoProfile = new DoctorPatientAssignment(null, patient2, AssignmentStatus.ACTIVE, null);

    when(assignmentRepository.findAll()).thenReturn(List.of(orphan, validPatientNoProfile));
    when(profileRepository.findByUserIdWithUser(pId)).thenReturn(Optional.empty());

    service.syncFromMedicalProfilesAndAssignments();

    verify(patientRepository, never()).save(any());
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Cập nhật PatientProfile đã tồn tại và gán tên bác sĩ phụ trách")
  void testSyncUpdatesExistingPatientProfileWithDoctorName() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    UUID patientId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    User doctorUser = new User("doc@aura.test", "pass", "BS. Tran Van Doc");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    User patientUser = new User("p@aura.test", "pass", "Nguyen Van Patient");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    DoctorPatientAssignment assignment = new DoctorPatientAssignment(doctorUser, patientUser, AssignmentStatus.ACTIVE, doctorId);
    when(assignmentRepository.findAll()).thenReturn(List.of(assignment));

    PatientMedicalProfile med = new PatientMedicalProfile(patientUser, "MRN-EXISTING");
    med.setGender("Female");
    med.setHasDiabetes(true);
    med.setHasHypertension(true);
    med.setHistoryOfSmoking(true);
    when(profileRepository.findByUserIdWithUser(patientId)).thenReturn(Optional.of(med));

    PatientProfile existingPp = new PatientProfile();
    existingPp.setUserId(patientId);
    existingPp.setMrn("MRN-EXISTING");
    when(patientRepository.findByUserId(patientId)).thenReturn(Optional.of(existingPp));

    service.syncFromMedicalProfilesAndAssignments();

    ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
    verify(patientRepository).save(captor.capture());
    PatientProfile saved = captor.getValue();
    assertThat(saved.getFullName()).isEqualTo("Nguyen Van Patient");
    assertThat(saved.getGender()).isEqualTo("Female");
    assertThat(saved.getHasDiabetes()).isTrue();
    assertThat(saved.getHasHypertension()).isTrue();
    assertThat(saved.getHistoryOfSmoking()).isTrue();
    assertThat(saved.getAssignedDoctor()).isEqualTo("BS. Tran Van Doc");
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: Khi một trong 3 repos là null -> return an toàn")
  void testSyncNullRepoVariations() {
    // profileRepository null
    PatientProfileService s1 = new PatientProfileService(null, userRepository, patientRepository, assignmentRepository);
    s1.syncFromMedicalProfilesAndAssignments();

    // patientRepository null
    PatientProfileService s2 = new PatientProfileService(profileRepository, userRepository, null, assignmentRepository);
    s2.syncFromMedicalProfilesAndAssignments();

    // assignmentRepository null
    PatientProfileService s3 = new PatientProfileService(profileRepository, userRepository, patientRepository, null);
    s3.syncFromMedicalProfilesAndAssignments();

    verify(patientRepository, never()).save(any());
  }

  @Test
  @DisplayName("createPatient: Đã có sẵn mrn hợp lệ khác null/blank -> giữ nguyên MRN ban đầu")
  void testCreatePatientWithPreExistingMrnRetainsMrn() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    PatientProfile patient = new PatientProfile();
    patient.setMrn("MRN-CUSTOM-2026-X99");
    patient.setFullName("Patient Custom MRN");

    when(patientRepository.save(any(PatientProfile.class))).thenAnswer(i -> i.getArgument(0));

    com.aura.patient.dto.PatientProfileDto dto = service.createPatient(patient);

    assertThat(dto.mrn()).isEqualTo("MRN-CUSTOM-2026-X99");
  }

  @Test
  @DisplayName("updateProfile: userRepository không tìm thấy -> ném ResourceNotFoundException")
  void testUpdateProfileUserNotFoundThrows() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID notFoundId = UUID.randomUUID();
    when(userRepository.findById(notFoundId)).thenReturn(Optional.empty());

    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        "Ten Mua", null, 30, "Male", null, null, null,
        120, 80, null, null, null, null, null, null, null, null, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(notFoundId, req))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining("Người dùng không tồn tại với ID: " + notFoundId);
  }

  @ParameterizedTest(name = "updateProfile blank fullName / gender: name=''{0}'', gender=''{1}''")
  @CsvSource({
    "'', ''",
    "'   ', '   '",
    ", "
  })
  @DisplayName("updateProfile: fullName và gender null/blank -> không ghi đè giá trị hiện hữu")
  void testUpdateProfileBlankFullNameAndGenderDoNotOverwrite(String emptyName, String emptyGender) {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User user = new User("patient@aura.test", "hash", "Original Name");
    PatientMedicalProfile profile = new PatientMedicalProfile(user, "MRN-KEEP-TEST");
    profile.setGender("OriginalGender");

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
        emptyName, null, 30, emptyGender, null, null, null,
        120, 80, null, null, null, null, null, null, null, null, null, null, null, null
    );

    PatientProfileResponse res = service.updateProfile(userId, req);

    assertThat(user.getFullName()).isEqualTo("Original Name");
    assertThat(profile.getGender()).isEqualTo("OriginalGender");
    verify(userRepository, never()).save(any());
  }

  @Test
  @DisplayName("syncFromMedicalProfilesAndAssignments: med.getUser().getFullName() null nhưng patient.getFullName() có -> lấy tên patient")
  void testSyncFullNameFallbackToPatientUserWhenMedicalUserNull() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    UUID patientId = UUID.randomUUID();
    User patientUser = new User("patient2@aura.test", "hash", "Benh Nhan Tu Assignment");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    // Doctor non-null but Doctor fullName is null
    User doctorUser = new User("doc@aura.test", "hash", null);
    DoctorPatientAssignment assignment = new DoctorPatientAssignment(doctorUser, patientUser, AssignmentStatus.ACTIVE, null);

    when(assignmentRepository.findAll()).thenReturn(List.of(assignment));

    // med.getUser() is null
    PatientMedicalProfile med = new PatientMedicalProfile(null, "MRN-PATIENT-FALLBACK");
    med.setUser(null);

    when(profileRepository.findByUserIdWithUser(patientId)).thenReturn(Optional.of(med));
    when(patientRepository.findByUserId(patientId)).thenReturn(Optional.empty());

    service.syncFromMedicalProfilesAndAssignments();

    ArgumentCaptor<PatientProfile> captor = ArgumentCaptor.forClass(PatientProfile.class);
    verify(patientRepository).save(captor.capture());

    PatientProfile saved = captor.getValue();
    assertThat(saved.getFullName()).isEqualTo("Benh Nhan Tu Assignment");
    assertThat(saved.getAssignedDoctor()).isNull(); // Doctor fullName is null -> not set
  }

  @Test
  @DisplayName("toResponse: profile.getUser() == null hoặc activeAssignment.getDoctor() == null -> trả về DTO với doctorId và doctorName là null")
  void testToResponseNullUserOrNullDoctorInAssignment() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    // Case 1: profile.getUser() == null
    PatientMedicalProfile profileNoUser = new PatientMedicalProfile(null, "MRN-NO-USER-2");
    ReflectionTestUtils.setField(profileNoUser, "id", UUID.randomUUID());
    when(profileRepository.findByUserIdWithUser(any())).thenReturn(Optional.empty());
    when(profileRepository.findById(any())).thenReturn(Optional.of(profileNoUser));

    PatientProfileResponse res1 = service.getProfileByPatientId(UUID.randomUUID());
    assertThat(res1.assignedDoctorId()).isNull();
    assertThat(res1.assignedDoctor()).isNull();

    // Case 2: activeAssignment có nhưng getDoctor() == null
    UUID userId = UUID.randomUUID();
    User user = new User("p@aura.test", "hash", "Benh Nhan Co User");
    ReflectionTestUtils.setField(user, "id", userId);
    PatientMedicalProfile profileWithUser = new PatientMedicalProfile(user, "MRN-HAS-USER");
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profileWithUser));

    DoctorPatientAssignment assignmentNoDoc = new DoctorPatientAssignment(null, user, AssignmentStatus.ACTIVE, null);
    when(assignmentRepository.findByPatientIdAndStatus(userId, AssignmentStatus.ACTIVE)).thenReturn(List.of(assignmentNoDoc));

    PatientProfileResponse res2 = service.getProfileByPatientId(userId);
    assertThat(res2.assignedDoctorId()).isNull();
    assertThat(res2.assignedDoctor()).isNull();
  }

  @Test
  @DisplayName("Constructors: Khởi tạo constructor 3 tham số và seedInitialPatientsIfEmpty")
  void testThreeArgConstructorAndSeed() {
    PatientProfileService s3 = new PatientProfileService(profileRepository, userRepository, assignmentRepository);
    assertThat(s3).isNotNull();

    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    when(assignmentRepository.findAll()).thenReturn(List.of());
    service.seedInitialPatientsIfEmpty();
    verify(assignmentRepository).findAll();
  }

  @Test
  @DisplayName("getOrCreateProfile: Tìm thấy hồ sơ sẵn có vs tạo mới khi chưa có hồ sơ")
  void testGetOrCreateProfileBranches() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User user = new User("newuser@aura.test", "pass", "Nguyen Van New");
    ReflectionTestUtils.setField(user, "id", userId);

    // Case 1: Hồ sơ đã tồn tại
    PatientMedicalProfile existing = new PatientMedicalProfile(user, "MRN-EXISTING-123");
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(existing));

    PatientProfileResponse res1 = service.getOrCreateProfile(userId);
    assertThat(res1.mrn()).isEqualTo("MRN-EXISTING-123");

    // Case 2: Hồ sơ chưa có nhưng user không tồn tại -> ném ResourceNotFoundException
    UUID missingUserId = UUID.randomUUID();
    when(profileRepository.findByUserIdWithUser(missingUserId)).thenReturn(Optional.empty());
    when(userRepository.findById(missingUserId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getOrCreateProfile(missingUserId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining("Người dùng không tồn tại với ID: " + missingUserId);

    // Case 3: Hồ sơ chưa có, user tồn tại, MRN1 chưa trùng -> tạo mới
    UUID createUserId = UUID.randomUUID();
    User user2 = new User("user2@aura.test", "pass", "User Two");
    ReflectionTestUtils.setField(user2, "id", createUserId);

    when(profileRepository.findByUserIdWithUser(createUserId)).thenReturn(Optional.empty());
    when(userRepository.findById(createUserId)).thenReturn(Optional.of(user2));
    when(profileRepository.existsByMrn(any())).thenReturn(false);
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(i -> i.getArgument(0));

    PatientProfileResponse res2 = service.getOrCreateProfile(createUserId);
    assertThat(res2).isNotNull();
    assertThat(res2.gender()).isEqualTo("Other");

    // Case 4: MRN1 bị trùng -> sinh MRN2
    when(profileRepository.existsByMrn(any())).thenReturn(true).thenReturn(false);
    PatientProfileResponse res3 = service.getOrCreateProfile(createUserId);
    assertThat(res3).isNotNull();
  }

  @Test
  @DisplayName("getPatientById: Tìm thấy bệnh nhân theo ID vs ném ngoại lệ ResourceNotFoundException")
  void testGetPatientById() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID id = UUID.randomUUID();
    PatientProfile p = new PatientProfile();
    ReflectionTestUtils.setField(p, "id", id);
    p.setFullName("Nguyen Van Test");
    p.setMrn("MRN-001");

    when(patientRepository.findById(id)).thenReturn(Optional.of(p));

    com.aura.patient.dto.PatientProfileDto dto = service.getPatientById(id);
    assertThat(dto.fullName()).isEqualTo("Nguyen Van Test");

    UUID missingId = UUID.randomUUID();
    when(patientRepository.findById(missingId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getPatientById(missingId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy hồ sơ bệnh nhân với ID: " + missingId);
  }

  @Test
  @DisplayName("updatePatient: Cập nhật thông tin bệnh nhân thành công vs không tìm thấy")
  void testUpdatePatient() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID id = UUID.randomUUID();
    PatientProfile existing = new PatientProfile();
    ReflectionTestUtils.setField(existing, "id", id);
    existing.setFullName("Old Name");

    when(patientRepository.findById(id)).thenReturn(Optional.of(existing));
    when(patientRepository.save(any(PatientProfile.class))).thenAnswer(i -> i.getArgument(0));

    PatientProfile updateData = new PatientProfile();
    updateData.setFullName("Updated Name");
    updateData.setAge(50);
    updateData.setGender("Male");
    updateData.setPhone("0987654321");
    updateData.setAddress("Hanoi");
    updateData.setSystolicBp(130);
    updateData.setDiastolicBp(85);
    updateData.setHba1c(6.2);
    updateData.setHasDiabetes(true);
    updateData.setHasHypertension(false);
    updateData.setHistoryOfSmoking(true);
    updateData.setAssignedDoctor("BS. Le");
    updateData.setRiskScore(75);
    updateData.setRiskLevel("HIGH");
    updateData.setReviewStatus("REVIEWED");
    updateData.setFindingsSummary("Finding");

    com.aura.patient.dto.PatientProfileDto updated = service.updatePatient(id, updateData);
    assertThat(updated.fullName()).isEqualTo("Updated Name");
    assertThat(updated.riskScore()).isEqualTo(75);

    UUID notFoundId = UUID.randomUUID();
    when(patientRepository.findById(notFoundId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.updatePatient(notFoundId, updateData))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);
  }

  @Test
  @DisplayName("createPatient: MRN null hoặc blank -> tự động sinh MRN chuẩn")
  void testCreatePatientGeneratesMrnWhenNullOrBlank() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);

    PatientProfile p1 = new PatientProfile();
    p1.setFullName("P1");
    p1.setMrn(null);
    when(patientRepository.save(any(PatientProfile.class))).thenAnswer(i -> i.getArgument(0));

    var res1 = service.createPatient(p1);
    assertThat(res1.mrn()).startsWith("MRN-");

    PatientProfile p2 = new PatientProfile();
    p2.setFullName("P2");
    p2.setMrn("   ");
    var res2 = service.createPatient(p2);
    assertThat(res2.mrn()).startsWith("MRN-");
  }

  @Test
  @DisplayName("searchPatients: Gọi findAll từ repository với specification")
  void testSearchPatients() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    when(patientRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), org.mockito.ArgumentMatchers.eq(pageable)))
        .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

    var page = service.searchPatients(
        "query", "HIGH", 50, 90, true, false, true, "BS. Nam", "PENDING", pageable
    );
    assertThat(page).isNotNull();
  }

  @Test
  @DisplayName("updateProfile: Kiểm tra các nhánh ngày sinh trong tương lai, tuổi > 120, và bloodType blank")
  void testUpdateProfileDobAndBloodTypeBranches() {
    PatientProfileService service =
        new PatientProfileService(profileRepository, userRepository, patientRepository, assignmentRepository);
    UUID userId = UUID.randomUUID();
    User user = new User("patient@aura.test", "hash", "Nguyen Van A");
    PatientMedicalProfile profile = new PatientMedicalProfile(user, "MRN-DOB-TEST");

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));

    // Case 1: Ngày sinh ở tương lai -> ném IllegalArgumentException
    UpdatePatientProfileRequest reqFuture = new UpdatePatientProfileRequest(
        "Nguyen Van A", java.time.LocalDate.now().plusDays(1), null, "Male", null, null, "O+",
        120, 80, null, false, null, null, false, false, false, false, null, null, null, null
    );
    assertThatThrownBy(() -> service.updateProfile(userId, reqFuture))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Ngày sinh không được ở tương lai");

    // Case 2: Tuổi > 120 -> ném IllegalArgumentException
    UpdatePatientProfileRequest reqTooOld = new UpdatePatientProfileRequest(
        "Nguyen Van A", java.time.LocalDate.now().minusYears(125), null, "Male", null, null, "O+",
        120, 80, null, false, null, null, false, false, false, false, null, null, null, null
    );
    assertThatThrownBy(() -> service.updateProfile(userId, reqTooOld))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Tuổi tính từ ngày sinh không được vượt quá 120");

    // Case 3: Ngày sinh hợp lệ và bloodType rỗng ("  ") -> bloodType thành null
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(i -> i.getArgument(0));
    UpdatePatientProfileRequest reqValidDob = new UpdatePatientProfileRequest(
        "Nguyen Van A", java.time.LocalDate.now().minusYears(30), null, "Male", "0123456789", "Ha Noi", "   ",
        120, 80, 5.0, false, null, null, false, false, false, false, "Thuoc", "Di ung", "Nguoi than", "0999"
    );
    PatientProfileResponse res = service.updateProfile(userId, reqValidDob);
    assertThat(res.age()).isEqualTo(30);
    assertThat(res.bloodType()).isNull();
    assertThat(res.currentMedications()).isEqualTo("Thuoc");
  }
}
