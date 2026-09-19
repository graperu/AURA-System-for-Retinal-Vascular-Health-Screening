package com.aura.screening.repository;

import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScreeningRepository extends JpaRepository<Screening, UUID> {
  List<Screening> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
  Page<Screening> findByPatientIdOrderByCreatedAtDesc(UUID patientId, Pageable pageable);

  List<Screening> findByPatientIdInOrderByCreatedAtDesc(List<UUID> patientIds);
  Page<Screening> findByPatientIdInOrderByCreatedAtDesc(List<UUID> patientIds, Pageable pageable);

  List<Screening> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId);
  Page<Screening> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId, Pageable pageable);
  Page<Screening> findByDoctorIdOrPatientIdInOrderByCreatedAtDesc(UUID doctorId, java.util.Collection<UUID> patientIds, Pageable pageable);

  List<Screening> findByStatusOrderByCreatedAtDesc(ScreeningStatus status);
  Page<Screening> findByStatusOrderByCreatedAtDesc(ScreeningStatus status, Pageable pageable);

  List<Screening> findAllByOrderByCreatedAtDesc();
  Page<Screening> findAllByOrderByCreatedAtDesc(Pageable pageable);

  long countByPatientId(UUID patientId);
  java.util.Optional<Screening> findTopByPatientIdOrderByCreatedAtDesc(UUID patientId);

  long countByClinicId(UUID clinicId);
  long countByClinicIdAndRiskLevelIn(UUID clinicId, java.util.Collection<com.aura.screening.entity.RiskLevel> riskLevels);
  List<Screening> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);
  Page<Screening> findByClinicIdOrderByCreatedAtDesc(UUID clinicId, Pageable pageable);
  long countByRiskLevelIn(java.util.Collection<com.aura.screening.entity.RiskLevel> riskLevels);
}
