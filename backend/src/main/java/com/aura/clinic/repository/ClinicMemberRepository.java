package com.aura.clinic.repository;

import com.aura.clinic.entity.ClinicMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicMemberRepository extends JpaRepository<ClinicMember, UUID> {
  @org.springframework.data.jpa.repository.Query("SELECT m FROM ClinicMember m JOIN FETCH m.doctor JOIN FETCH m.clinic WHERE m.clinic.id = :clinicId")
  List<ClinicMember> findByClinicId(@org.springframework.data.repository.query.Param("clinicId") UUID clinicId);

  Optional<ClinicMember> findByClinicIdAndDoctorId(UUID clinicId, UUID doctorId);

  boolean existsByClinicIdAndDoctorId(UUID clinicId, UUID doctorId);
}
