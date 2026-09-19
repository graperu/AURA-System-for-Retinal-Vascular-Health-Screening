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
import com.aura.doctor.entity.DoctorPatientAssignment;
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

import com.aura.patient.dto.DoctorOptionDto;
import com.aura.patient.dto.RegisterExaminationRequest;
import com.aura.role.enums.RoleName;
import com.aura.user.repository.UserRoleRepository;

@Service
public class PatientProfileService {

  private static final Logger log = LoggerFactory.getLogger(PatientProfileService.class);

  private final PatientMedicalProfileRepository profileRepository;
  private final UserRepository userRepository;
  private final PatientProfileRepository patientRepository;
  private final DoctorPatientAssignmentRepository assignmentRepository;
  private final UserRoleRepository userRoleRepository;
  private final com.aura.role.repository.RoleRepository roleRepository;

  @org.springframework.beans.factory.annotation.Autowired
  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      PatientProfileRepository patientRepository,
      DoctorPatientAssignmentRepository assignmentRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      UserRoleRepository userRoleRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
      com.aura.role.repository.RoleRepository roleRepository) {
    this.profileRepository = profileRepository;
    this.userRepository = userRepository;
    this.patientRepository = patientRepository;
    this.assignmentRepository = assignmentRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      PatientProfileRepository patientRepository,
      DoctorPatientAssignmentRepository assignmentRepository,
      UserRoleRepository userRoleRepository) {
    this(profileRepository, userRepository, patientRepository, assignmentRepository, userRoleRepository, null);
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository) {
    this(profileRepository, userRepository, null, null, null);
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      DoctorPatientAssignmentRepository assignmentRepository) {
    this(profileRepository, userRepository, null, assignmentRepository, null);
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      PatientProfileRepository patientRepository,
      DoctorPatientAssignmentRepository assignmentRepository) {
    this(profileRepository, userRepository, patientRepository, assignmentRepository, null);
  }

  // --- FR-18 Worklist & Filter methods ---

  @Transactional(readOnly = true)
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
    return searchPatients(search, riskLevel, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, null, pageable);
  }

  @Transactional(readOnly = true)
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
      List<UUID> allowedPatientIds,
      Pageable pageable) {
    Specification<PatientProfile> spec = PatientSpecification.filterPatients(
        search,
        riskLevel,
        minScore,
        maxScore,
        hasDiabetes,
        hasHypertension,
        historyOfSmoking,
        doctorName,
        reviewStatus,
        allowedPatientIds);
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
    return createPatient(patient, null);
  }

  @Transactional
  public PatientProfileDto createPatient(PatientProfile patient, UUID doctorId) {
    if (patient.getMrn() == null || patient.getMrn().isBlank()) {
      patient.setMrn("MRN-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
    }

    // 1. Tìm hoặc tạo User tài khoản bệnh nhân
    User patientUser = null;
    if (patient.getUserId() != null && userRepository != null) {
      patientUser = userRepository.findById(patient.getUserId()).orElse(null);
    }
    if (patientUser == null && userRepository != null) {
      String cleanMrn = patient.getMrn().trim().toLowerCase().replaceAll("[^a-z0-9]", "");
      String email = "patient_" + cleanMrn + "@aura.local";
      if (userRepository.existsByEmailIgnoreCase(email)) {
        email = "patient_" + cleanMrn + "_" + UUID.randomUUID().toString().substring(0, 4) + "@aura.local";
      }
      User newUser = new User(email, "$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/fU3015Bf/TcvB3cTeqr9f2oV2Dde", patient.getFullName());
      newUser.setEmailVerified(true);
      newUser.setActive(true);
      patientUser = userRepository.save(newUser);

      if (patientUser != null && roleRepository != null && userRoleRepository != null) {
        var userRoleOpt = roleRepository.findByName(RoleName.USER);
        if (userRoleOpt.isPresent()) {
          userRoleRepository.save(new com.aura.user.entity.UserRole(patientUser, userRoleOpt.get()));
        }
      }
      if (patientUser != null && patientUser.getId() != null) {
        patient.setUserId(patientUser.getId());
      }
    }

    // 2. Tìm Bác sĩ phụ trách và tạo phân công nếu có doctorId
    User doctorUser = null;
    if (doctorId != null && userRepository != null) {
      doctorUser = userRepository.findById(doctorId).orElse(null);
    }
    if (doctorUser != null) {
      String docName = doctorUser.getFullName() != null && !doctorUser.getFullName().isBlank() ? doctorUser.getFullName() : doctorUser.getEmail();
      patient.setAssignedDoctor(docName);
      if (assignmentRepository != null && patientUser != null && patientUser.getId() != null && doctorUser.getId() != null) {
        final User pUser = patientUser;
        final User dUser = doctorUser;
        DoctorPatientAssignment assignment = assignmentRepository
            .findByDoctorIdAndPatientId(dUser.getId(), pUser.getId())
            .orElseGet(() -> new DoctorPatientAssignment(dUser, pUser, AssignmentStatus.ACTIVE, doctorId));
        assignment.setStatus(AssignmentStatus.ACTIVE);
        assignment.setAssignedAt(java.time.Instant.now());
        assignment.setAssignedBy(doctorId);
        assignmentRepository.save(assignment);
      }
    }

    // 3. Tạo hoặc đồng bộ PatientMedicalProfile để lưu trữ đầy đủ sinh hiệu (HA, HbA1c, bệnh lý)
    if (profileRepository != null && patientUser != null && patientUser.getId() != null) {
      final User pUser = patientUser;
      PatientMedicalProfile medProfile = profileRepository.findByUserIdWithUser(pUser.getId())
          .orElseGet(() -> new PatientMedicalProfile(pUser, patient.getMrn()));
      if (patient.getAge() != null) medProfile.setAge(patient.getAge());
      if (patient.getGender() != null) medProfile.setGender(patient.getGender());
      if (patient.getPhone() != null) medProfile.setPhoneNumber(patient.getPhone());
      if (patient.getAddress() != null) medProfile.setAddress(patient.getAddress());
      if (patient.getSystolicBp() != null) medProfile.setSystolicBp(patient.getSystolicBp());
      if (patient.getDiastolicBp() != null) medProfile.setDiastolicBp(patient.getDiastolicBp());
      if (patient.getHba1c() != null) medProfile.setHba1c(patient.getHba1c());
      if (patient.getHasDiabetes() != null) medProfile.setHasDiabetes(patient.getHasDiabetes());
      if (patient.getHasHypertension() != null) medProfile.setHasHypertension(patient.getHasHypertension());
      if (patient.getHistoryOfSmoking() != null) medProfile.setHistoryOfSmoking(patient.getHistoryOfSmoking());
      if (doctorUser != null) {
        medProfile.setAssignedDoctor(patient.getAssignedDoctor());
      }
      profileRepository.save(medProfile);
    }

    if (patient.getReviewStatus() == null || patient.getReviewStatus().isBlank()) {
      patient.setReviewStatus("PENDING");
    }
    if (patient.getLastExamDate() == null || patient.getLastExamDate().isBlank()) {
      patient.setLastExamDate(LocalDate.now().toString());
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
    PatientProfile saved = patientRepository.save(existing);
    syncToMedicalProfile(saved);
    return PatientProfileDto.from(saved);
  }

  private void syncToMedicalProfile(PatientProfile patientProfile) {
    if (profileRepository == null || patientProfile == null) {
      return;
    }
    UUID patientUserId = patientProfile.getUserId();
    String mrn = patientProfile.getMrn();

    // 1. Sync User.fullName if user exists
    if (patientUserId != null && userRepository != null && patientProfile.getFullName() != null && !patientProfile.getFullName().isBlank()) {
      userRepository.findById(patientUserId).ifPresent(u -> {
        if (!patientProfile.getFullName().trim().equals(u.getFullName())) {
          u.setFullName(patientProfile.getFullName().trim());
          userRepository.save(u);
        }
      });
    }

    // 2. Find existing or instantiate new PatientMedicalProfile
    java.util.Optional<PatientMedicalProfile> medProfileOpt = java.util.Optional.empty();
    if (patientUserId != null) {
      medProfileOpt = profileRepository.findByUserIdWithUser(patientUserId)
          .or(() -> profileRepository.findByUserId(patientUserId));
    }
    if (medProfileOpt.isEmpty() && mrn != null && !mrn.isBlank()) {
      medProfileOpt = profileRepository.findByMrn(mrn);
    }

    PatientMedicalProfile medProfile = medProfileOpt.orElseGet(() -> {
      if (patientUserId != null && userRepository != null) {
        User user = userRepository.findById(patientUserId).orElse(null);
        if (user != null) {
          return new PatientMedicalProfile(user, mrn != null ? mrn : "MRN-" + UUID.randomUUID());
        }
      }
      return null;
    });

    if (medProfile == null) {
      return;
    }

    if (patientProfile.getAge() != null) medProfile.setAge(patientProfile.getAge());
    if (patientProfile.getGender() != null && !patientProfile.getGender().isBlank()) medProfile.setGender(patientProfile.getGender());
    if (patientProfile.getPhone() != null) medProfile.setPhoneNumber(patientProfile.getPhone());
    if (patientProfile.getAddress() != null) medProfile.setAddress(patientProfile.getAddress());
    if (patientProfile.getSystolicBp() != null) medProfile.setSystolicBp(patientProfile.getSystolicBp());
    if (patientProfile.getDiastolicBp() != null) medProfile.setDiastolicBp(patientProfile.getDiastolicBp());
    if (patientProfile.getHba1c() != null) medProfile.setHba1c(patientProfile.getHba1c());
    if (patientProfile.getHasDiabetes() != null) medProfile.setHasDiabetes(patientProfile.getHasDiabetes());
    if (patientProfile.getHasHypertension() != null) medProfile.setHasHypertension(patientProfile.getHasHypertension());
    if (patientProfile.getHistoryOfSmoking() != null) medProfile.setHistoryOfSmoking(patientProfile.getHistoryOfSmoking());
    if (patientProfile.getAssignedDoctor() != null && !patientProfile.getAssignedDoctor().isBlank()) {
      medProfile.setAssignedDoctor(patientProfile.getAssignedDoctor());
    }
    profileRepository.save(medProfile);
  }

  @Transactional
  public void deletePatient(UUID id) {
    PatientProfile existing = patientRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân với ID: " + id));

    if (existing.getUserId() != null && assignmentRepository != null) {
      var assignments = assignmentRepository.findByPatientId(existing.getUserId());
      if (assignments != null && !assignments.isEmpty()) {
        assignmentRepository.deleteAll(assignments);
      }
    }
    patientRepository.delete(existing);
  }

  @Transactional
  public int batchDeletePatients(List<UUID> ids) {
    if (ids == null || ids.isEmpty()) {
      return 0;
    }
    int count = 0;
    for (UUID id : ids) {
      if (id != null && patientRepository.existsById(id)) {
        deletePatient(id);
        count++;
      }
    }
    return count;
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

  @Transactional
  public void syncAssignedDoctor(UUID patientUserId, String doctorName) {
    if (patientUserId == null) return;
    if (profileRepository != null) {
      profileRepository.findByUserId(patientUserId).ifPresent(med -> {
        med.setAssignedDoctor(doctorName);
        profileRepository.save(med);
      });
    }
    if (patientRepository != null) {
      patientRepository.findByUserId(patientUserId).ifPresent(p -> {
        p.setAssignedDoctor(doctorName);
        patientRepository.save(p);
      });
    }
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

    if (profile != null && profile.getUser() != null) {
      syncWorklistProfile(profile.getUser(), profile);
    }
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
    syncWorklistProfile(user, saved);
    return toResponse(saved);
  }

  private void syncWorklistProfile(User user, PatientMedicalProfile savedProfile) {
    if (patientRepository == null || user == null || savedProfile == null) {
      return;
    }
    UUID patientUserId = user.getId();
    String mrn = savedProfile.getMrn();
    PatientProfile worklistProfile = patientRepository.findByUserId(patientUserId)
        .or(() -> (mrn != null && !mrn.isBlank() ? patientRepository.findByMrn(mrn) : java.util.Optional.empty()))
        .orElseGet(() -> {
          PatientProfile np = new PatientProfile();
          np.setUserId(patientUserId);
          np.setMrn(mrn);
          return np;
        });

    worklistProfile.setFullName(user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : "Bệnh nhân");
    if (savedProfile.getAge() != null) worklistProfile.setAge(savedProfile.getAge());
    if (savedProfile.getGender() != null && !savedProfile.getGender().isBlank()) worklistProfile.setGender(savedProfile.getGender());
    if (savedProfile.getPhoneNumber() != null) worklistProfile.setPhone(savedProfile.getPhoneNumber());
    if (savedProfile.getAddress() != null) worklistProfile.setAddress(savedProfile.getAddress());
    if (savedProfile.getSystolicBp() != null) worklistProfile.setSystolicBp(savedProfile.getSystolicBp());
    if (savedProfile.getDiastolicBp() != null) worklistProfile.setDiastolicBp(savedProfile.getDiastolicBp());
    if (savedProfile.getHba1c() != null) worklistProfile.setHba1c(savedProfile.getHba1c());
    worklistProfile.setHasDiabetes(savedProfile.getHasDiabetes() != null ? savedProfile.getHasDiabetes() : false);
    worklistProfile.setHasHypertension(savedProfile.getHasHypertension() != null ? savedProfile.getHasHypertension() : false);
    worklistProfile.setHistoryOfSmoking(savedProfile.getHistoryOfSmoking() != null ? savedProfile.getHistoryOfSmoking() : false);
    if (savedProfile.getAssignedDoctor() != null && !savedProfile.getAssignedDoctor().isBlank()) {
      worklistProfile.setAssignedDoctor(savedProfile.getAssignedDoctor());
    }

    patientRepository.save(worklistProfile);
  }

  @Transactional(readOnly = true)
  public PatientProfileResponse getProfileByPatientId(UUID patientId) {
    PatientMedicalProfile profile = profileRepository.findByUserIdWithUser(patientId)
        .or(() -> profileRepository.findById(patientId))
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ y tế với ID: " + patientId));

    return toResponse(profile);
  }

  @Transactional(readOnly = true)
  public List<DoctorOptionDto> getAvailableDoctors() {
    if (userRoleRepository == null) {
      return List.of();
    }
    List<User> doctors = userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR);
    return doctors.stream()
        .map(d -> new DoctorOptionDto(
            d.getId(),
            d.getFullName() != null && !d.getFullName().isBlank() ? d.getFullName() : d.getEmail(),
            d.getEmail(),
            "Bác sĩ Chuyên khoa Mắt & Tim mạch",
            "BS. Chuyên khoa"
        ))
        .toList();
  }

  @Transactional
  public PatientProfileResponse registerExamination(UUID patientUserId, RegisterExaminationRequest request) {
    User patientUser = userRepository.findById(patientUserId)
        .orElseThrow(() -> new ResourceNotFoundException("Bệnh nhân không tồn tại với ID: " + patientUserId));

    // 1. Xác định Bác sĩ được chỉ định
    User assignedDoctorUser = null;
    if (request != null && request.doctorId() != null) {
      assignedDoctorUser = userRepository.findById(request.doctorId()).orElse(null);
    }
    if (assignedDoctorUser == null && userRoleRepository != null) {
      List<User> activeDoctors = userRoleRepository.findActiveUsersByRole(RoleName.DOCTOR);
      if (!activeDoctors.isEmpty()) {
        assignedDoctorUser = activeDoctors.get(0);
      }
    }

    // 2. Tạo hoặc kích hoạt bản ghi phân công khám (DoctorPatientAssignment)
    if (assignedDoctorUser != null && assignmentRepository != null) {
      User finalDoctor = assignedDoctorUser;
      DoctorPatientAssignment assignment = assignmentRepository
          .findByDoctorIdAndPatientId(finalDoctor.getId(), patientUserId)
          .orElseGet(() -> new DoctorPatientAssignment(finalDoctor, patientUser, AssignmentStatus.ACTIVE, patientUserId));
      assignment.setStatus(AssignmentStatus.ACTIVE);
      assignment.setAssignedAt(java.time.Instant.now());
      assignment.setAssignedBy(patientUserId);
      assignmentRepository.save(assignment);
    }

    // 3. Cập nhật hồ sơ bệnh án điện tử (PatientMedicalProfile)
    String doctorDisplayName = assignedDoctorUser != null
        ? (assignedDoctorUser.getFullName() != null && !assignedDoctorUser.getFullName().isBlank() ? assignedDoctorUser.getFullName() : assignedDoctorUser.getEmail())
        : "Bác sĩ Chuyên khoa";

    PatientMedicalProfile profile = profileRepository.findByUserIdWithUser(patientUserId)
        .orElseGet(() -> {
          String generatedMrn = "MRN-" + Year.now().getValue() + "-" +
              patientUserId.toString().replace("-", "").substring(0, 4).toUpperCase();
          return new PatientMedicalProfile(patientUser, generatedMrn);
        });

    profile.setAssignedDoctor(doctorDisplayName);
    if (request != null) {
      if (request.systolicBp() != null) profile.setSystolicBp(request.systolicBp());
      if (request.diastolicBp() != null) profile.setDiastolicBp(request.diastolicBp());
      if (request.hba1c() != null) profile.setHba1c(request.hba1c());
      if (request.hasDiabetes() != null) profile.setHasDiabetes(request.hasDiabetes());
      if (request.hasHypertension() != null) profile.setHasHypertension(request.hasHypertension());
      if (request.historyOfSmoking() != null) profile.setHistoryOfSmoking(request.historyOfSmoking());
    }

    PatientMedicalProfile savedProfile = profileRepository.save(profile);

    // 4. Đồng bộ hoặc tạo bản ghi PatientProfile phục vụ Bác sĩ tìm kiếm & làm việc trên Worklist
    if (patientRepository != null) {
      String mrn = savedProfile.getMrn();
      PatientProfile worklistProfile = patientRepository.findByUserId(patientUserId)
          .or(() -> (mrn != null && !mrn.isBlank() ? patientRepository.findByMrn(mrn) : java.util.Optional.empty()))
          .orElseGet(() -> {
            PatientProfile np = new PatientProfile();
            np.setUserId(patientUserId);
            np.setMrn(mrn);
            return np;
          });

      worklistProfile.setFullName(patientUser.getFullName() != null && !patientUser.getFullName().isBlank() ? patientUser.getFullName() : "Bệnh nhân");
      worklistProfile.setAge(savedProfile.getAge() != null ? savedProfile.getAge() : 45);
      worklistProfile.setGender(savedProfile.getGender() != null ? savedProfile.getGender() : "Other");
      worklistProfile.setPhone(savedProfile.getPhoneNumber());
      worklistProfile.setAddress(savedProfile.getAddress());
      worklistProfile.setSystolicBp(savedProfile.getSystolicBp() != null ? savedProfile.getSystolicBp() : 120);
      worklistProfile.setDiastolicBp(savedProfile.getDiastolicBp() != null ? savedProfile.getDiastolicBp() : 80);
      worklistProfile.setHba1c(savedProfile.getHba1c() != null ? savedProfile.getHba1c() : 5.7);
      worklistProfile.setHasDiabetes(savedProfile.getHasDiabetes() != null ? savedProfile.getHasDiabetes() : false);
      worklistProfile.setHasHypertension(savedProfile.getHasHypertension() != null ? savedProfile.getHasHypertension() : false);
      worklistProfile.setHistoryOfSmoking(savedProfile.getHistoryOfSmoking() != null ? savedProfile.getHistoryOfSmoking() : false);
      worklistProfile.setAssignedDoctor(doctorDisplayName);
      worklistProfile.setReviewStatus("PENDING");
      worklistProfile.setLastExamDate(LocalDate.now().toString());

      if (request != null && request.examinationReason() != null && !request.examinationReason().isBlank()) {
        worklistProfile.setFindingsSummary("Đăng ký khám: " + request.examinationReason().trim() +
            (request.symptomsNotes() != null && !request.symptomsNotes().isBlank() ? " | Triệu chứng: " + request.symptomsNotes().trim() : ""));
      }

      patientRepository.save(worklistProfile);
    }

    UUID docId = assignedDoctorUser != null ? assignedDoctorUser.getId() : null;
    return PatientProfileResponse.fromEntity(savedProfile, docId, doctorDisplayName);
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
