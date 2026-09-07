package com.aura.patient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatientProfileServiceTest {

  @Mock private PatientMedicalProfileRepository profileRepository;
  @Mock private UserRepository userRepository;
  @Mock private DoctorPatientAssignmentRepository assignmentRepository;

  private PatientProfileService service;
  private User mockUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    service = new PatientProfileService(profileRepository, userRepository, assignmentRepository);
    userId = UUID.randomUUID();
    mockUser = new User("patient@example.com", "hash", "Nguyen Van A");
  }

  @Test
  void getOrCreateProfile_whenProfileExists_returnsExisting() {
    var existing = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    existing.setAge(50);
    existing.setSystolicBp(130);
    existing.setDiastolicBp(85);

    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(existing));

    var res = service.getOrCreateProfile(userId);

    assertThat(res).isNotNull();
    assertThat(res.mrn()).isEqualTo("MRN-2026-0001");
    assertThat(res.fullName()).isEqualTo("Nguyen Van A");
    assertThat(res.age()).isEqualTo(50);
    assertThat(res.systolicBp()).isEqualTo(130);
    assertThat(res.diastolicBp()).isEqualTo(85);
    verify(profileRepository, never()).save(any());
  }

  @Test
  void getOrCreateProfile_whenProfileNotExists_createsDefaultWithNullVitals() {
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.empty());
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.existsByMrn(anyString())).thenReturn(false);
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    var res = service.getOrCreateProfile(userId);

    assertThat(res).isNotNull();
    assertThat(res.mrn()).startsWith("MRN-");
    // New profile should NOT have fake mock vitals, blood type, assigned doctor, or mock conditions
    assertThat(res.systolicBp()).isNull();
    assertThat(res.diastolicBp()).isNull();
    assertThat(res.hba1c()).isNull();
    assertThat(res.age()).isNull();
    assertThat(res.bloodType()).isNull();
    assertThat(res.assignedDoctor()).isNull();
    assertThat(res.hasDiabetes()).isNull();
    assertThat(res.hasHypertension()).isNull();
    assertThat(res.historyOfSmoking()).isNull();
    assertThat(res.historyOfHeartDisease()).isNull();
    assertThat(res.historyOfStroke()).isNull();
    verify(profileRepository).save(any(PatientMedicalProfile.class));
  }

  @Test
  void updateProfile_withTriStateConditions_persistsExactlyWithoutConvertingNullToFalse() {
    var profile = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    // Test with hasDiabetes = false, hasHypertension = true, historyOfSmoking = null
    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, null,
        null, null, null, false, null, null, true, null, false, null, null, null, null, null
    );

    var res = service.updateProfile(userId, request);

    assertThat(res.hasDiabetes()).isFalse();
    assertThat(res.hasHypertension()).isTrue();
    assertThat(res.historyOfSmoking()).isNull();
    assertThat(res.historyOfHeartDisease()).isFalse();
    assertThat(res.historyOfStroke()).isNull();
    assertThat(res.bloodType()).isNull();
  }

  @Test
  void updateProfile_withBloodTypeA_persistsCorrectly() {
    var profile = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, "A+",
        null, null, null, null, null, null, null, null, null, null, null, null, null, null
    );

    var res = service.updateProfile(userId, request);

    assertThat(res.bloodType()).isEqualTo("A+");
  }

  @Test
  void updateProfile_withEmptyBloodType_persistsNull() {
    var profile = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    profile.setBloodType("O+");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, "",
        null, null, null, null, null, null, null, null, null, null, null, null, null, null
    );

    var res = service.updateProfile(userId, request);

    assertThat(res.bloodType()).isNull();
  }

  @Test
  void updateProfile_withValidDateOfBirth_calculatesAgeCorrectly() {
    var profile = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    LocalDate dob = LocalDate.now().minusYears(25);
    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", dob, null, "Male", null, null, "O+",
        120, 80, 5.6, false, "None", 0, false, false, false, false, null, null, null, null
    );

    var res = service.updateProfile(userId, request);

    assertThat(res).isNotNull();
    assertThat(res.dateOfBirth()).isEqualTo(dob);
    assertThat(res.age()).isEqualTo(25);
  }

  @Test
  void updateProfile_withFutureDateOfBirth_throwsException() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    LocalDate futureDob = LocalDate.now().plusDays(1);
    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", futureDob, null, "Male", null, null, "O+",
        120, 80, 5.6, false, "None", 0, false, false, false, false, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(userId, request))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Ngày sinh không được ở tương lai");
  }

  @Test
  void updateProfile_withValidBloodPressure120_80_succeeds() {
    var profile = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, "O+",
        120, 80, null, false, "None", 0, false, false, false, false, null, null, null, null
    );

    var res = service.updateProfile(userId, request);

    assertThat(res.systolicBp()).isEqualTo(120);
    assertThat(res.diastolicBp()).isEqualTo(80);
  }

  @Test
  void updateProfile_withEqualBloodPressure96_96_throwsException() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, "O+",
        96, 96, null, false, "None", 0, false, false, false, false, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(userId, request))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương");
  }

  @Test
  void updateProfile_withReversedBloodPressure80_100_throwsException() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A", null, 30, "Male", null, null, "O+",
        80, 100, null, false, "None", 0, false, false, false, false, null, null, null, null
    );

    assertThatThrownBy(() -> service.updateProfile(userId, request))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương");
  }

  @Test
  void updateProfile_updatesVitalsAndMedicalHistory() {
    var profile = new PatientMedicalProfile(mockUser, "MRN-2026-0001");
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.of(profile));
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    var request = new UpdatePatientProfileRequest(
        "Nguyen Van A Updated",
        LocalDate.of(1980, 5, 15),
        null,
        "Male",
        "0912345678",
        "123 Nguyen Hue, Q1, HCMC",
        "O+",
        135,
        88,
        6.8,
        true,
        "Type2",
        5,
        true,
        false,
        true,
        true, // history of stroke
        "Metformin 500mg, Amlodipine 5mg",
        "Penicillin",
        "Nguyen Thi B",
        "0987654321"
    );

    var res = service.updateProfile(userId, request);

    assertThat(res).isNotNull();
    assertThat(mockUser.getFullName()).isEqualTo("Nguyen Van A Updated");
    assertThat(res.fullName()).isEqualTo("Nguyen Van A Updated");
    assertThat(res.systolicBp()).isEqualTo(135);
    assertThat(res.diastolicBp()).isEqualTo(88);
    assertThat(res.hba1c()).isEqualTo(6.8);
    assertThat(res.hasDiabetes()).isTrue();
    assertThat(res.diabetesType()).isEqualTo("Type2");
    assertThat(res.hasHypertension()).isTrue();
    assertThat(res.historyOfStroke()).isTrue();
    assertThat(res.currentMedications()).contains("Metformin");
    assertThat(res.allergies()).isEqualTo("Penicillin");
    assertThat(res.emergencyContactName()).isEqualTo("Nguyen Thi B");
    assertThat(res.emergencyContactPhone()).isEqualTo("0987654321");
  }
}

