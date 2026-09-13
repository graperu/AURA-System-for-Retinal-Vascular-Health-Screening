package com.aura.screening.repository;

import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScreeningRepository extends JpaRepository<Screening, UUID> {
  List<Screening> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
  List<Screening> findByPatientIdInOrderByCreatedAtDesc(List<UUID> patientIds);
  List<Screening> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId);
  List<Screening> findByStatusOrderByCreatedAtDesc(ScreeningStatus status);
  List<Screening> findAllByOrderByCreatedAtDesc();

  long countByPatientId(UUID patientId);
  java.util.Optional<Screening> findTopByPatientIdOrderByCreatedAtDesc(UUID patientId);

  long countByClinicId(UUID clinicId);
  long countByClinicIdAndRiskLevelIn(UUID clinicId, java.util.Collection<com.aura.screening.entity.RiskLevel> riskLevels);
  List<Screening> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);
  long countByRiskLevelIn(java.util.Collection<com.aura.screening.entity.RiskLevel> riskLevels);
}
