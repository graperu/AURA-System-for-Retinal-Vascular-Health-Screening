package com.aura.patient.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.patient.repository.PatientSpecification;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import java.time.LocalDate;
import java.time.Period;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientProfileService {

  private static final Logger log = LoggerFactory.getLogger(PatientProfileService.class);

  private final PatientMedicalProfileRepository profileRepository;
  private final UserRepository userRepository;
  private final PatientProfileRepository patientRepository;
  private final DoctorPatientAssignmentRepository assignmentRepository;

  @org.springframework.beans.factory.annotation.Autowired
  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      PatientProfileRepository patientRepository,
      DoctorPatientAssignmentRepository assignmentRepository) {
    this.profileRepository = profileRepository;
    this.userRepository = userRepository;
    this.patientRepository = patientRepository;
    this.assignmentRepository = assignmentRepository;
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository) {
    this(profileRepository, userRepository, null, null);
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      DoctorPatientAssignmentRepository assignmentRepository) {
    this(profileRepository, userRepository, null, assignmentRepository);
  }

  // --- FR-18 Worklist & Filter methods ---

  @Transactional
  public Page<PatientProfileDto> searchPatients(
      String search,
      String riskLevel,
      Integer minScore,
      Integer maxScore,
      Boolean hasDiabetes,
      Boolean hasHypertension,
      Boolean historyOfSmoking,
      String doctorName,
      String reviewStatus,
      Pageable pageable) {
    syncFromMedicalProfilesAndAssignments();
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        search,
        riskLevel,
        minScore,
        maxScore,
        hasDiabetes,
        hasHypertension,
        historyOfSmoking,
        doctorName,
        reviewStatus);
    return patientRepository.findAll(spec, pageable).map(PatientProfileDto::from);
  }

  @Transactional(readOnly = true)
  public List<PatientProfileResponse> getPatientsForDoctor(UUID doctorId) {
    if (assignmentRepository == null || profileRepository == null) {
      return List.of();
    }
    var assignments = assignmentRepository.findByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE);
    return assignments.stream()
        .map(a -> {
          UUID pId = a.getPatient().getId();
          return profileRepository.findByUserIdWithUser(pId)
              .map(med -> PatientProfileResponse.fromEntity(med, doctorId, a.getDoctor().getFullName()))
              .orElse(null);
        })
        .filter(java.util.Objects::nonNull)
        .toList();
  }

  @Transactional(readOnly = true)
  public PatientProfileDto getPatientById(UUID id) {
    return patientRepository
        .findById(id)
        .map(PatientProfileDto::from)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân với ID: " + id));
  }

  @Transactional
  public PatientProfileDto createPatient(PatientProfile patient) {
    if (patient.getMrn() == null || patient.getMrn().isBlank()) {
      patient.setMrn("MRN-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
    }
    return PatientProfileDto.from(patientRepository.save(patient));
  }

  @Transactional
  public PatientProfileDto updatePatient(UUID id, PatientProfile updatedData) {
    PatientProfile existing = patientRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân với ID: " + id));

    existing.setFullName(updatedData.getFullName());
    existing.setAge(updatedData.getAge());
    existing.setGender(updatedData.getGender());
    existing.setPhone(updatedData.getPhone());
    existing.setAddress(updatedData.getAddress());
    existing.setSystolicBp(updatedData.getSystolicBp());
    existing.setDiastolicBp(updatedData.getDiastolicBp());
    existing.setHba1c(updatedData.getHba1c());
    existing.setHasDiabetes(updatedData.getHasDiabetes());
    existing.setHasHypertension(updatedData.getHasHypertension());
    existing.setHistoryOfSmoking(updatedData.getHistoryOfSmoking());
    existing.setAssignedDoctor(updatedData.getAssignedDoctor());
    existing.setRiskScore(updatedData.getRiskScore());
    existing.setRiskLevel(updatedData.getRiskLevel());
    existing.setReviewStatus(updatedData.getReviewStatus());
    existing.setFindingsSummary(updatedData.getFindingsSummary());

    return PatientProfileDto.from(patientRepository.save(existing));
  }

  @Transactional
  public void syncFromMedicalProfilesAndAssignments() {
    try {
      if (assignmentRepository == null || profileRepository == null || patientRepository == null) {
        return;
      }
      var assignments = assignmentRepository.findAll();
      for (var assignment : assignments) {
        if (assignment.getPatient() != null) {
          UUID patientUserId = assignment.getPatient().getId();
          var medicalOpt = profileRepository.findByUserIdWithUser(patientUserId);
          if (medicalOpt.isPresent()) {
            var med = medicalOpt.get();
            var existingProfileOpt = patientRepository.findByUserId(patientUserId);
            PatientProfile pp = existingProfileOpt.orElseGet(() -> {
              PatientProfile p = new PatientProfile();
              p.setUserId(patientUserId);
              p.setMrn(med.getMrn());
              return p;
            });
            String fullName = med.getUser() != null && med.getUser().getFullName() != null
                ? med.getUser().getFullName()
                : (assignment.getPatient().getFullName() != null ? assignment.getPatient().getFullName() : "Bệnh nhân");
            pp.setFullName(fullName);
            pp.setAge(med.getAge());
            pp.setGender(med.getGender() != null ? med.getGender() : "Other");
            pp.setPhone(med.getPhoneNumber());
            pp.setAddress(med.getAddress());
            pp.setSystolicBp(med.getSystolicBp());
            pp.setDiastolicBp(med.getDiastolicBp());
            pp.setHba1c(med.getHba1c());
            pp.setHasDiabetes(med.getHasDiabetes() != null ? med.getHasDiabetes() : false);
            pp.setHasHypertension(med.getHasHypertension() != null ? med.getHasHypertension() : false);
            pp.setHistoryOfSmoking(med.getHistoryOfSmoking() != null ? med.getHistoryOfSmoking() : false);
            if (assignment.getDoctor() != null && assignment.getDoctor().getFullName() != null) {
              pp.setAssignedDoctor(assignment.getDoctor().getFullName());
            }
            patientRepository.save(pp);
          }
        }
      }
    } catch (Exception ex) {
      log.warn("Không thể đồng bộ patient profiles từ assignments: {}", ex.getMessage());
    }
  }

  @Transactional
  public void seedInitialPatientsIfEmpty() {
    // Vô hiệu hóa seed mock data: không chèn các bản ghi mồ côi với user_id=null nữa.
    // Thay vào đó đồng bộ các bệnh nhân thực tế từ patient_medical_profiles & doctor_patient_assignments
    syncFromMedicalProfilesAndAssignments();
  }

  // --- Patient Medical Profile methods ---

  @Transactional
  public PatientProfileResponse getOrCreateProfile(UUID userId) {
    var profile = profileRepository.findByUserIdWithUser(userId)
        .orElseGet(() -> {
          User user = userRepository.findById(userId)
              .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại với ID: " + userId));

          String generatedMrn = "MRN-" + Year.now().getValue() + "-" +
              userId.toString().replace("-", "").substring(0, 4).toUpperCase();

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
    var activeAssignment = (patientId == null || assignmentRepository == null) ? null : assignmentRepository
        .findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)
        .stream()
        .findFirst()
        .orElse(null);
    UUID doctorId = activeAssignment != null && activeAssignment.getDoctor() != null
        ? activeAssignment.getDoctor().getId()
        : null;
    String doctorName = activeAssignment != null && activeAssignment.getDoctor() != null
        ? activeAssignment.getDoctor().getFullName()
        : null;
    return PatientProfileResponse.fromEntity(profile, doctorId, doctorName);
  }
}
