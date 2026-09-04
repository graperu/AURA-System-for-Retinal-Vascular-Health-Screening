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
import java.time.LocalDate;
import java.time.Period;
import java.time.Year;
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

  @org.springframework.beans.factory.annotation.Autowired
  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository,
      PatientProfileRepository patientRepository) {
    this.profileRepository = profileRepository;
    this.userRepository = userRepository;
    this.patientRepository = patientRepository;
  }

  public PatientProfileService(
      PatientMedicalProfileRepository profileRepository,
      UserRepository userRepository) {
    this(profileRepository, userRepository, null);
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

  @PostConstruct
  @Transactional
  public void seedInitialPatientsIfEmpty() {
    try {
      if (patientRepository.count() == 0) {
        log.info("[AURA PATIENT SEED] Seeding initial realistic clinical patient profiles into PostgreSQL...");

        createSeedPatient("MRN-2026-0941", "Bệnh nhân Nguyễn Trọng Nam", 58, "Male", "0912 345 678", 154, 96, 8.2, true,
            true, true, "2026-09-03", "BS. CKII Nguyễn Thị Thanh", 85, "HIGH", "PENDING_REVIEW",
            "Đã thực hiện các ca khám sàng lọc. Bắt chéo động-tĩnh mạch (Gunn sign), co hẹp vi mạch đáy mắt.",
            "from-red-500 to-rose-600");
        createSeedPatient("MRN-2026-0942", "Trần Văn Hoàng", 58, "Male", "0912 345 679", 154, 96, 8.2, true, true, true,
            "2026-09-02", "BS. CKII Nguyễn Thị Thanh", 82, "HIGH", "PENDING_REVIEW",
            "Bắt chéo động-tĩnh mạch (Gunn sign), hẹp lòng mạch tiểu động mạch độ II, nghi ngờ NPDR nhẹ.",
            "from-orange-500 to-red-600");
        createSeedPatient("MRN-2026-1033", "Lê Thị Mai", 44, "Female", "0988 234 567", 128, 82, 5.9, false, false,
            false, "2026-09-01", "BS. Phan Định", 28, "LOW", "REVIEWED",
            "Cấu trúc vi mạch đáy mắt bình thường, không có dấu hiệu phình vi mạch hay xuất huyết.",
            "from-emerald-500 to-teal-600");
        createSeedPatient("MRN-2026-1188", "Phạm Đức Anh", 67, "Male", "0903 888 999", 168, 102, 9.4, true, true, true,
            "2026-08-30", "BS. CKII Nguyễn Thị Thanh", 91, "SEVERE", "CRITICAL",
            "BÁO ĐỘNG ĐỎ: Xuất huyết chấm nông, xuất tiết cứng hoàng điểm kèm hẹp nặng vi mạch (A/V: 0.48).",
            "from-purple-600 to-indigo-700");
        createSeedPatient("MRN-2026-1204", "Nguyễn Văn Hùng", 52, "Male", "0977 123 456", 142, 90, 7.1, true, true,
            false, "2026-08-28", "BS. CKII Nguyễn Thị Thanh", 62, "MODERATE", "PENDING_REVIEW",
            "Hẹp vi mạch khu trú vùng thái dương trên, vi phình mạch rải rác.", "from-amber-500 to-orange-600");
        createSeedPatient("MRN-2026-1219", "Đặng Thị Lan", 61, "Female", "0918 567 890", 136, 86, 6.8, true, false,
            false, "2026-08-25", "BS. Phan Định", 54, "MODERATE", "REVIEWED",
            "Theo dõi tiến triển bệnh võng mạc đái tháo đường giai đoạn sớm, vi mạch tương đối ổn định.",
            "from-cyan-500 to-blue-600");
        createSeedPatient("MRN-2026-1233", "Vũ Đình Quang", 72, "Male", "0933 445 566", 175, 108, 8.8, true, true, true,
            "2026-08-20", "BS. CKII Nguyễn Thị Thanh", 88, "HIGH", "PENDING_REVIEW",
            "Xơ vữa tiểu động mạch võng mạc độ 3 (dây bạc - Silver wiring), có ổ xuất huyết nhỏ chu biên.",
            "from-rose-600 to-red-700");
        createSeedPatient("MRN-2026-1240", "Hoàng Kim Ngân", 36, "Female", "0944 556 677", 118, 76, 5.4, false, false,
            false, "2026-08-18", "BS. Phan Định", 18, "LOW", "REVIEWED",
            "Đáy mắt hoàn toàn bình thường, gai thị hồng rõ nét, tỷ lệ A/V đạt 2/3.", "from-green-500 to-emerald-600");
        createSeedPatient("MRN-2026-1255", "Bùi Văn Thành", 55, "Male", "0966 778 899", 148, 92, 7.6, true, true, false,
            "2026-08-15", "BS. CKII Nguyễn Thị Thanh", 74, "MODERATE", "PENDING_REVIEW",
            "Dấu hiệu Salus bắt chéo A/V, uốn khúc nhẹ nhánh thái dương, đề nghị tái khám 3 tháng.",
            "from-yellow-500 to-amber-600");
        createSeedPatient("MRN-2026-1280", "Trịnh Thị Hương", 64, "Female", "0911 223 344", 162, 98, 8.5, true, true,
            false, "2026-08-10", "BS. CKII Nguyễn Thị Thanh", 79, "HIGH", "PENDING_REVIEW",
            "Phù gai thị nghi ngờ tăng huyết áp ác tính, đề nghị phối hợp chuyên khoa tim mạch.",
            "from-red-600 to-rose-700");

        log.info("[AURA PATIENT SEED] Successfully seeded realistic clinical patient profiles.");
      }
    } catch (Exception ex) {
      log.warn("[AURA PATIENT SEED] Failed to seed initial patients: {}", ex.getMessage());
    }
  }

  private void createSeedPatient(
      String mrn,
      String fullName,
      int age,
      String gender,
      String phone,
      int sysBp,
      int diaBp,
      double hba1c,
      boolean hasDiabetes,
      boolean hasHypertension,
      boolean historyOfSmoking,
      String lastExamDate,
      String assignedDoctor,
      int riskScore,
      String riskLevel,
      String reviewStatus,
      String findings,
      String avatarColor) {
    PatientProfile p = new PatientProfile(mrn, fullName, age, gender, phone);
    p.setSystolicBp(sysBp);
    p.setDiastolicBp(diaBp);
    p.setHba1c(hba1c);
    p.setHasDiabetes(hasDiabetes);
    p.setHasHypertension(hasHypertension);
    p.setHistoryOfSmoking(historyOfSmoking);
    p.setLastExamDate(lastExamDate);
    p.setAssignedDoctor(assignedDoctor);
    p.setRiskScore(riskScore);
    p.setRiskLevel(riskLevel);
    p.setReviewStatus(reviewStatus);
    p.setFindingsSummary(findings);
    p.setAvatarColor(avatarColor);
    patientRepository.save(p);
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
