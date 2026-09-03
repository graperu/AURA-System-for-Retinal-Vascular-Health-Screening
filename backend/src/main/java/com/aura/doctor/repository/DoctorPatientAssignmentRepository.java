package com.aura.doctor.repository;

import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorPatientAssignmentRepository extends JpaRepository<DoctorPatientAssignment, UUID> {

  List<DoctorPatientAssignment> findByDoctorIdAndStatus(UUID doctorId, AssignmentStatus status);

  List<DoctorPatientAssignment> findByPatientId(UUID patientId);

  boolean existsByDoctorIdAndPatientIdAndStatus(UUID doctorId, UUID patientId, AssignmentStatus status);

  Optional<DoctorPatientAssignment> findByDoctorIdAndPatientId(UUID doctorId, UUID patientId);

  @Query("SELECT d.patient.id FROM DoctorPatientAssignment d WHERE d.doctor.id = :doctorId AND d.status = :status")
  List<UUID> findPatientIdsByDoctorIdAndStatus(@Param("doctorId") UUID doctorId, @Param("status") AssignmentStatus status);
}
