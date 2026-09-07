package com.aura.clinic.repository;

import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicProfileRepository extends JpaRepository<ClinicProfile, UUID> {
  Optional<ClinicProfile> findByUserId(UUID userId);

  List<ClinicProfile> findByVerificationStatus(VerificationStatus status);
}
