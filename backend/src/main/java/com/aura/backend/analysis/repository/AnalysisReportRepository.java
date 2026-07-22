package com.aura.backend.analysis.repository;

import com.aura.backend.analysis.entity.AnalysisReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisReportRepository extends JpaRepository<AnalysisReport, Long> {
    List<AnalysisReport> findByPatientId(Long patientId);
    List<AnalysisReport> findByDoctorId(Long doctorId);
    List<AnalysisReport> findByClinicId(Long clinicId);
}
