package com.aura.patient.repository;

import com.aura.patient.entity.PatientLabDocument;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientLabDocumentRepository extends JpaRepository<PatientLabDocument, UUID> {
  List<PatientLabDocument> findByPatientIdOrderByUploadedAtDesc(UUID patientId);
  Optional<PatientLabDocument> findByIdAndPatientId(UUID id, UUID patientId);
}
