package com.aura.clinic.repository;

import com.aura.clinic.entity.ClinicMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicMemberRepository extends JpaRepository<ClinicMember, UUID> {
  List<ClinicMember> findByClinicId(UUID clinicId);

  Optional<ClinicMember> findByClinicIdAndDoctorId(UUID clinicId, UUID doctorId);

  boolean existsByClinicIdAndDoctorId(UUID clinicId, UUID doctorId);
}
