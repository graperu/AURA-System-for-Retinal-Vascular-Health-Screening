package com.aura.feedback.service;

import com.aura.feedback.dto.DoctorFeedbackRequest;
import com.aura.feedback.dto.DoctorFeedbackResponse;
import com.aura.feedback.entity.DoctorFeedback;
import com.aura.feedback.repository.DoctorFeedbackRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DoctorFeedbackService {

  private final DoctorFeedbackRepository doctorFeedbackRepository;

  public DoctorFeedbackService(DoctorFeedbackRepository doctorFeedbackRepository) {
    this.doctorFeedbackRepository = doctorFeedbackRepository;
  }

  @Transactional
  public DoctorFeedbackResponse submitFeedback(UUID doctorId, DoctorFeedbackRequest request) {
    DoctorFeedback feedback =
        new DoctorFeedback(
            doctorId,
            request.screeningId(),
            request.aiRiskLevel(),
            request.doctorRiskLevel(),
            request.isAccurate(),
            request.feedbackNotes(),
            request.vesselAnnotationData());

    // FR-19: chỉ đưa vào kho dữ liệu tái huấn luyện các mẫu có giá trị hiệu
    // chỉnh thật sự - tức là bác sĩ đánh giá AI sai (isAccurate = false) hoặc
    // có kèm chú thích vùng tổn thương cụ thể. Feedback "đồng ý hoàn toàn với
    // AI, không có chú thích" thì không mang thêm tín hiệu huấn luyện mới.
    boolean hasLesionAnnotation =
        request.vesselAnnotationData() != null && !request.vesselAnnotationData().isBlank();
    boolean eligibleForRetraining = Boolean.FALSE.equals(request.isAccurate()) || hasLesionAnnotation;
    feedback.setIncludedInRetraining(eligibleForRetraining);

    DoctorFeedback saved = doctorFeedbackRepository.save(feedback);
    return DoctorFeedbackResponse.fromEntity(saved);
  }

  @Transactional(readOnly = true)
  public Page<DoctorFeedbackResponse> getDoctorFeedbacks(UUID doctorId, Pageable pageable) {
    return doctorFeedbackRepository
        .findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable)
        .map(DoctorFeedbackResponse::fromEntity);
  }

  @Transactional(readOnly = true)
  public List<DoctorFeedbackResponse> getFeedbacksByScreening(UUID screeningId) {
    return doctorFeedbackRepository.findByScreeningId(screeningId).stream()
        .map(DoctorFeedbackResponse::fromEntity)
        .toList();
  }
}
