package com.aura.patient.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.patient.repository.PatientSpecification;
import jakarta.annotation.PostConstruct;
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

  private final PatientProfileRepository patientRepository;

  public PatientProfileService(PatientProfileRepository patientRepository) {
    this.patientRepository = patientRepository;
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

  @Transactional(readOnly = true)
  public PatientProfileDto getPatientByMrn(String mrn) {
    return patientRepository
        .findByMrn(mrn)
        .map(PatientProfileDto::from)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh nhân với MRN: " + mrn));
  }

  @Transactional
  public PatientProfileDto createPatient(PatientProfile patient) {
    if (patientRepository.existsByMrn(patient.getMrn())) {
      throw new IllegalArgumentException("Mã hồ sơ bệnh án (MRN) đã tồn tại: " + patient.getMrn());
    }
    PatientProfile saved = patientRepository.save(patient);
    return PatientProfileDto.from(saved);
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

  /**
   * Tự động khởi tạo dữ liệu mẫu bệnh nhân vào CSDL PostgreSQL nếu bảng đang
   * rỗng.
   */
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
            "2026-08-22", "BS. CKII Nguyễn Thị Thanh", 86, "HIGH", "PENDING_REVIEW",
            "Xơ cứng động mạch võng mạc (dây bạc), nguy cơ nhồi máu vi mạch và đột quỵ cấp.",
            "from-rose-600 to-red-700");
        createSeedPatient("MRN-2026-1248", "Bùi Thị Bích", 38, "Female", "0966 789 012", 118, 76, 5.4, false, false,
            false, "2026-08-20", "BS. Phan Định", 18, "LOW", "REVIEWED",
            "Gai thị hồng rõ, tỷ lệ C/D 0.3 bình thường, không tổn hại lớp sợi thần kinh võng mạc.",
            "from-teal-500 to-emerald-600");
        createSeedPatient("MRN-2026-1262", "Ngô Thanh Tùng", 50, "Male", "0908 991 223", 148, 94, 7.6, true, true, true,
            "2026-08-18", "BS. CKII Nguyễn Thị Thanh", 76, "HIGH", "PENDING_REVIEW",
            "Hiện tượng bắt chéo động-tĩnh mạch kèm giãn phình tĩnh mạch khẩu kính không đều.",
            "from-red-500 to-pink-600");
        createSeedPatient("MRN-2026-1277", "Đỗ Thị Thu", 65, "Female", "0913 224 466", 152, 92, 6.9, false, true, false,
            "2026-08-15", "BS. Phan Định", 68, "MODERATE", "REVIEWED",
            "Tăng huyết áp võng mạc giai đoạn II (dấu hiệu Salus), cần kiểm soát HA mục tiêu < 130/80.",
            "from-amber-600 to-yellow-600");
        createSeedPatient("MRN-2026-1291", "Hoàng Minh Tuấn", 46, "Male", "0972 556 778", 132, 84, 6.2, false, false,
            true, "2026-08-12", "BS. CKII Nguyễn Thị Thanh", 36, "LOW", "REVIEWED",
            "Mạng lưới vi mạch bình thường, lưu ý giảm hút thuốc để phòng ngừa xơ vữa mạch máu.",
            "from-sky-500 to-indigo-600");
        createSeedPatient("MRN-2026-1305", "Trương Ngọc Ánh", 55, "Female", "0945 667 889", 160, 98, 8.5, true, true,
            false, "2026-08-08", "BS. CKII Nguyễn Thị Thanh", 79, "HIGH", "PENDING_REVIEW",
            "Phát hiện xuất huyết đốm cạnh hoàng điểm OD, nghi ngờ phù hoàng điểm do đái tháo đường.",
            "from-orange-500 to-rose-600");
        createSeedPatient("MRN-2026-1320", "Lý Quốc Bảo", 63, "Male", "0922 334 455", 146, 92, 7.0, true, true, true,
            "2026-08-05", "BS. Phan Định", 59, "MODERATE", "REVIEWED",
            "Tổn thương vi mạch nhẹ, tỷ lệ A/V 0.58. Khuyến nghị tái khám sau 3 tháng.", "from-blue-600 to-cyan-600");
        createSeedPatient("MRN-2026-1335", "Dương Thúy Hằng", 41, "Female", "0981 112 233", 122, 78, 5.6, false, false,
            false, "2026-07-31", "BS. Phan Định", 22, "LOW", "REVIEWED",
            "Kết quả sàng lọc hoàn toàn bình thường, không phát hiện dấu hiệu bệnh lý mạch máu võng mạc.",
            "from-teal-600 to-green-600");
        createSeedPatient("MRN-2026-1350", "Tạ Quang Khải", 69, "Male", "0909 887 766", 172, 104, 9.1, true, true, true,
            "2026-07-28", "BS. CKII Nguyễn Thị Thanh", 89, "SEVERE", "CRITICAL",
            "BÁO ĐỘNG ĐỎ: Đốm xuất huyết võng mạc diện rộng, co thắt tiểu động mạch cấp tính.",
            "from-red-600 to-rose-700");
        createSeedPatient("MRN-2026-1365", "Nguyễn Thị Kim Oanh", 59, "Female", "0937 445 566", 138, 88, 6.6, false,
            true, false, "2026-07-24", "BS. CKII Nguyễn Thị Thanh", 49, "MODERATE", "REVIEWED",
            "Dấu hiệu tăng huyết áp võng mạc độ I, vi mạch chưa có tổn thương cấu trúc vĩnh viễn.",
            "from-amber-500 to-emerald-600");
        createSeedPatient("MRN-2026-1380", "Phan Văn Trực", 54, "Male", "0919 778 899", 156, 96, 7.8, true, true, false,
            "2026-07-20", "BS. Phan Định", 78, "HIGH", "PENDING_REVIEW",
            "Vi phình mạch nhiều ổ, cần chụp huỳnh quang đáy mắt FFA để xác định rò rỉ dịch.",
            "from-rose-500 to-orange-600");

        log.info("[AURA PATIENT SEED] Successfully seeded 16 patient profiles into PostgreSQL!");
      }
    } catch (Exception e) {
      log.warn("[AURA PATIENT SEED] Could not seed initial patients: {}", e.getMessage());
    }
  }

  private void createSeedPatient(
      String mrn,
      String fullName,
      int age,
      String gender,
      String phone,
      int systolicBp,
      int diastolicBp,
      double hba1c,
      boolean diabetes,
      boolean hypertension,
      boolean smoking,
      String lastExamDate,
      String assignedDoctor,
      int riskScore,
      String riskLevel,
      String reviewStatus,
      String findingsSummary,
      String avatarColor) {
    PatientProfile p = new PatientProfile(mrn, fullName, age, gender, phone);
    p.setSystolicBp(systolicBp);
    p.setDiastolicBp(diastolicBp);
    p.setHba1c(hba1c);
    p.setHasDiabetes(diabetes);
    p.setHasHypertension(hypertension);
    p.setHistoryOfSmoking(smoking);
    p.setLastExamDate(lastExamDate);
    p.setAssignedDoctor(assignedDoctor);
    p.setRiskScore(riskScore);
    p.setRiskLevel(riskLevel);
    p.setReviewStatus(reviewStatus);
    p.setFindingsSummary(findingsSummary);
    p.setAvatarColor(avatarColor);
    patientRepository.save(p);
  }
}
