package com.aura.patient.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.Year;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientProfileService {

  private final PatientMedicalProfileRepository profileRepository;
  private final UserRepository userRepository;

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository) {
    this.profileRepository = profileRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public PatientProfileResponse getOrCreateProfile(UUID userId) {
    var profile = profileRepository.findByUserIdWithUser(userId)
        .orElseGet(() -> {
          User user = userRepository.findById(userId)
              .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

          String generatedMrn = "MRN-" + Year.now().getValue() + "-" +
              userId.toString().replace("-", "").substring(0, 4).toUpperCase();

          // Check if MRN collision (rare)
          if (profileRepository.existsByMrn(generatedMrn)) {
            generatedMrn = "MRN-" + Year.now().getValue() + "-" +
                userId.toString().replace("-", "").substring(4, 8).toUpperCase();
          }

          PatientMedicalProfile newProfile = new PatientMedicalProfile(user, generatedMrn);
          newProfile.setAge(45);
          newProfile.setGender("Other");
          newProfile.setSystolicBp(120);
          newProfile.setDiastolicBp(80);
          newProfile.setHba1c(5.6);
          newProfile.setHasDiabetes(false);
          newProfile.setHasHypertension(false);
          newProfile.setHistoryOfSmoking(false);
          newProfile.setAssignedDoctor("BS. CKII Nguyễn Thị Thanh");
          return profileRepository.save(newProfile);
        });

    return PatientProfileResponse.fromEntity(profile);
  }

  @Transactional
  public PatientProfileResponse updateProfile(UUID userId, UpdatePatientProfileRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

    if (request.fullName() != null && !request.fullName().isBlank()) {
      user.setFullName(request.fullName().trim());
      userRepository.save(user);
    }

    PatientMedicalProfile profile = profileRepository.findByUserIdWithUser(userId)
        .orElseGet(() -> {
          String generatedMrn = "MRN-" + Year.now().getValue() + "-" +
              userId.toString().replace("-", "").substring(0, 4).toUpperCase();
          return new PatientMedicalProfile(user, generatedMrn);
        });

    if (request.dateOfBirth() != null) profile.setDateOfBirth(request.dateOfBirth());
    if (request.age() != null) profile.setAge(request.age());
    if (request.gender() != null) profile.setGender(request.gender());
    if (request.phoneNumber() != null) profile.setPhoneNumber(request.phoneNumber().trim());
    if (request.address() != null) profile.setAddress(request.address().trim());
    if (request.bloodType() != null) profile.setBloodType(request.bloodType().trim());
    if (request.systolicBp() != null) profile.setSystolicBp(request.systolicBp());
    if (request.diastolicBp() != null) profile.setDiastolicBp(request.diastolicBp());
    if (request.hba1c() != null) profile.setHba1c(request.hba1c());
    if (request.hasDiabetes() != null) profile.setHasDiabetes(request.hasDiabetes());
    if (request.diabetesType() != null) profile.setDiabetesType(request.diabetesType());
    if (request.diabetesDurationYears() != null) profile.setDiabetesDurationYears(request.diabetesDurationYears());
    if (request.hasHypertension() != null) profile.setHasHypertension(request.hasHypertension());
    if (request.historyOfSmoking() != null) profile.setHistoryOfSmoking(request.historyOfSmoking());
    if (request.historyOfHeartDisease() != null) profile.setHistoryOfHeartDisease(request.historyOfHeartDisease());
    if (request.historyOfStroke() != null) profile.setHistoryOfStroke(request.historyOfStroke());
    if (request.currentMedications() != null) profile.setCurrentMedications(request.currentMedications().trim());
    if (request.allergies() != null) profile.setAllergies(request.allergies().trim());
    if (request.emergencyContactName() != null) profile.setEmergencyContactName(request.emergencyContactName().trim());
    if (request.emergencyContactPhone() != null) profile.setEmergencyContactPhone(request.emergencyContactPhone().trim());

    PatientMedicalProfile saved = profileRepository.save(profile);
    return PatientProfileResponse.fromEntity(saved);
  }

  @Transactional(readOnly = true)
  public PatientProfileResponse getProfileByPatientId(UUID patientId) {
    PatientMedicalProfile profile = profileRepository.findByUserIdWithUser(patientId)
        .or(() -> profileRepository.findById(patientId))
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ y tế với ID: " + patientId));

    return PatientProfileResponse.fromEntity(profile);
  }
}
