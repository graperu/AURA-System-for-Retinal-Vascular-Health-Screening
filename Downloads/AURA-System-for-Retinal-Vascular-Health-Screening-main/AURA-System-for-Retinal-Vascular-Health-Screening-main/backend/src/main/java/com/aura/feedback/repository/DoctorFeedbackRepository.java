package com.aura.feedback.repository;

import com.aura.feedback.entity.DoctorFeedback;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorFeedbackRepository extends JpaRepository<DoctorFeedback, UUID> {
  List<DoctorFeedback> findByScreeningId(UUID screeningId);

  Page<DoctorFeedback> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId, Pageable pageable);

  List<DoctorFeedback> findByIncludedInRetrainingFalse();
}
