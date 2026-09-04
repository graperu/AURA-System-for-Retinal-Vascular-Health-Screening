package com.aura.patient.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import java.time.LocalDate;
import java.time.Period;
import java.time.Year;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientProfileService {

  private final PatientMedicalProfileRepository profileRepository;
  private final UserRepository userRepository;
  private final DoctorPatientAssignmentRepository assignmentRepository;

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      DoctorPatientAssignmentRepository assignmentRepository) {
    this.profileRepository = profileRepository;
    this.userRepository = userRepository;
    this.assignmentRepository = assignmentRepository;
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
          newProfile.setGender("Other");
          newProfile.setHasDiabetes(null);
          newProfile.setHasHypertension(null);
          newProfile.setHistoryOfSmoking(null);
          newProfile.setHistoryOfHeartDisease(null);
          newProfile.setHistoryOfStroke(null);
          newProfile.setAssignedDoctor(null);
          return profileRepository.save(newProfile);
        });

    return toResponse(profile);
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

    // Handle date of birth and calculate age
    if (request.dateOfBirth() != null) {
      LocalDate dob = request.dateOfBirth();
      LocalDate today = LocalDate.now();
      if (dob.isAfter(today)) {
        throw new IllegalArgumentException("Ngày sinh không được ở tương lai");
      }
      int calculatedAge = Period.between(dob, today).getYears();
      if (calculatedAge > 120) {
        throw new IllegalArgumentException("Tuổi tính từ ngày sinh không được vượt quá 120");
      }
      profile.setDateOfBirth(dob);
      profile.setAge(calculatedAge);
    } else if (request.age() != null) {
      profile.setAge(request.age());
    }

    // Cross-field validation: systolicBp must be greater than diastolicBp
    Integer sys = request.systolicBp();
    Integer dia = request.diastolicBp();
    if (sys != null && dia != null && sys <= dia) {
      throw new IllegalArgumentException("Huyết áp tâm thu phải lớn hơn huyết áp tâm trương");
    }

    profile.setSystolicBp(sys);
    profile.setDiastolicBp(dia);
    profile.setHba1c(request.hba1c());

    if (request.gender() != null && !request.gender().isBlank()) profile.setGender(request.gender());
    if (request.phoneNumber() != null) profile.setPhoneNumber(request.phoneNumber().trim());
    if (request.address() != null) profile.setAddress(request.address().trim());
    if (request.bloodType() != null) {
      String bt = request.bloodType().trim();
      profile.setBloodType(bt.isEmpty() ? null : bt);
    }

    profile.setHasDiabetes(request.hasDiabetes());
    if (Boolean.TRUE.equals(request.hasDiabetes())) {
      profile.setDiabetesType(request.diabetesType() != null && !request.diabetesType().isBlank() ? request.diabetesType().trim() : "Type2");
      profile.setDiabetesDurationYears(request.diabetesDurationYears() != null ? request.diabetesDurationYears() : 0);
    } else {
      profile.setDiabetesType(null);
      profile.setDiabetesDurationYears(null);
    }

    profile.setHasHypertension(request.hasHypertension());
    profile.setHistoryOfSmoking(request.historyOfSmoking());
    profile.setHistoryOfHeartDisease(request.historyOfHeartDisease());
    profile.setHistoryOfStroke(request.historyOfStroke());
    if (request.currentMedications() != null) profile.setCurrentMedications(request.currentMedications().trim());
    if (request.allergies() != null) profile.setAllergies(request.allergies().trim());
    if (request.emergencyContactName() != null) profile.setEmergencyContactName(request.emergencyContactName().trim());
    if (request.emergencyContactPhone() != null) profile.setEmergencyContactPhone(request.emergencyContactPhone().trim());

    PatientMedicalProfile saved = profileRepository.save(profile);
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public PatientProfileResponse getProfileByPatientId(UUID patientId) {
    PatientMedicalProfile profile = profileRepository.findByUserIdWithUser(patientId)
        .or(() -> profileRepository.findById(patientId))
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ y tế với ID: " + patientId));

    return toResponse(profile);
  }

  private PatientProfileResponse toResponse(PatientMedicalProfile profile) {
    UUID patientId = profile.getUser() != null ? profile.getUser().getId() : null;
    UUID doctorId = patientId == null ? null : assignmentRepository
        .findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)
        .stream()
        .findFirst()
        .map(assignment -> assignment.getDoctor().getId())
        .orElse(null);
    return PatientProfileResponse.fromEntity(profile, doctorId);
  }
}

