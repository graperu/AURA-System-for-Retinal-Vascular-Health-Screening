package com.aura.patient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
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

  private PatientProfileService service;
  private User mockUser;
  private UUID userId;

  @BeforeEach
  void setUp() {
    service = new PatientProfileService(profileRepository, userRepository);
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
    verify(profileRepository, never()).save(any());
  }

  @Test
  void getOrCreateProfile_whenProfileNotExists_createsDefault() {
    when(profileRepository.findByUserIdWithUser(userId)).thenReturn(Optional.empty());
    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(profileRepository.existsByMrn(anyString())).thenReturn(false);
    when(profileRepository.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));

    var res = service.getOrCreateProfile(userId);

    assertThat(res).isNotNull();
    assertThat(res.mrn()).startsWith("MRN-");
    assertThat(res.systolicBp()).isEqualTo(120);
    assertThat(res.diastolicBp()).isEqualTo(80);
    verify(profileRepository).save(any(PatientMedicalProfile.class));
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
        46,
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
        false,
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
    assertThat(res.currentMedications()).contains("Metformin");
    assertThat(res.allergies()).isEqualTo("Penicillin");
    assertThat(res.emergencyContactName()).isEqualTo("Nguyen Thi B");
  }
}
