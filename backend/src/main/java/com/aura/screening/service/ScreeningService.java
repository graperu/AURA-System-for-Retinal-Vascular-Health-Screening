package com.aura.screening.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScreeningService {

  private final ScreeningRepository screeningRepository;
  private final Random random = new Random();

  public ScreeningService(ScreeningRepository screeningRepository) {
    this.screeningRepository = screeningRepository;
  }

  @Transactional
  public Screening createScreening(UUID patientId, String imageUrl) {
    Screening screening = new Screening(patientId, imageUrl);
    
    // Mock AI Analysis calculation
    RiskLevel[] riskLevels = RiskLevel.values();
    RiskLevel mockRisk = riskLevels[random.nextInt(riskLevels.length)];
    double mockConfidence = 0.85 + (random.nextDouble() * 0.12);
    
    String mockFindings;
    switch (mockRisk) {
      case LOW:
        mockFindings = "Cấu trúc mạch máu võng mạc bình thường (AVR ~ 0.67). Không phát hiện biến dạng động mạch hay xuất huyết.";
        break;
      case MODERATE:
        mockFindings = "Phát hiện hẹp động mạch nhỏ dải rác. Tỷ lệ AVR giảm nhẹ (~ 0.58). Khuyên tái khám sau 6 tháng.";
        break;
      case HIGH:
        mockFindings = "Xuất hiện vệt bắt chéo động-tĩnh mạch (AV nicking) nghi ngờ xơ vữa mạch máu. AVR ~ 0.49.";
        break;
      case CRITICAL:
        mockFindings = "Dấu hiệu vi xuất huyết võng mạc và hẹp động mạch diện rộng. Cần bác sĩ chuyên khoa mắt đánh giá khẩn cấp.";
        break;
      default:
        mockFindings = "Chỉ số võng mạc ổn định.";
    }

    screening.setRiskLevel(mockRisk);
    screening.setConfidence(Math.round(mockConfidence * 100.0) / 100.0);
    screening.setFindings(mockFindings);
    screening.setStatus(ScreeningStatus.ANALYZED);

    return screeningRepository.save(screening);
  }

  @Transactional(readOnly = true)
  public List<Screening> getScreeningsForPatient(UUID patientId) {
    return screeningRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
  }

  @Transactional(readOnly = true)
  public List<Screening> getAllScreenings() {
    return screeningRepository.findAllByOrderByCreatedAtDesc();
  }

  @Transactional(readOnly = true)
  public Screening getScreeningById(UUID id) {
    return screeningRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Ca sàng lọc không tồn tại với ID: " + id));
  }

  @Transactional
  public Screening addDoctorReview(UUID screeningId, UUID doctorId, String doctorNotes, RiskLevel updatedRiskLevel) {
    Screening screening = getScreeningById(screeningId);
    screening.setDoctorId(doctorId);
    screening.setDoctorNotes(doctorNotes);
    if (updatedRiskLevel != null) {
      screening.setRiskLevel(updatedRiskLevel);
    }
    screening.setStatus(ScreeningStatus.REVIEWED);
    return screeningRepository.save(screening);
  }
}
