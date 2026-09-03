package com.aura.patient.repository;

import com.aura.patient.entity.PatientMedicalProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientMedicalProfileRepository extends JpaRepository<PatientMedicalProfile, UUID> {

  Optional<PatientMedicalProfile> findByUserId(UUID userId);

  Optional<PatientMedicalProfile> findByMrn(String mrn);

  boolean existsByUserId(UUID userId);

  boolean existsByMrn(String mrn);

  @Query("SELECT p FROM PatientMedicalProfile p JOIN FETCH p.user WHERE p.user.id = :userId")
  Optional<PatientMedicalProfile> findByUserIdWithUser(@Param("userId") UUID userId);
}
