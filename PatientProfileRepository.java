package com.aura.patient.repository;

import com.aura.patient.entity.PatientProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientProfileRepository
    extends JpaRepository<PatientProfile, UUID>, JpaSpecificationExecutor<PatientProfile> {

  Optional<PatientProfile> findByMrn(String mrn);

  Optional<PatientProfile> findByUserId(UUID userId);

  boolean existsByMrn(String mrn);
}
