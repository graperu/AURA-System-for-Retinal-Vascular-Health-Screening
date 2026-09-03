package com.aura.patient.controller;

import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.service.PatientProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor/patients")
@Tag(name = "Doctor Patient Management", description = "Endpoints for Doctor Patient Worklist, Search, Filter & Pagination (FR-13, FR-18)")
public class DoctorPatientController {

  private final PatientProfileService patientService;

  public DoctorPatientController(PatientProfileService patientService) {
    this.patientService = patientService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC', 'USER')")
  @Operation(summary = "Get paginated patients with dynamic filter and search (FR-18)")
  public ApiResponse<PageResponse<PatientProfileDto>> searchPatients(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String risk,
      @RequestParam(required = false) Integer minScore,
      @RequestParam(required = false) Integer maxScore,
      @RequestParam(required = false) Boolean hasDiabetes,
      @RequestParam(required = false) Boolean hasHypertension,
      @RequestParam(required = false) Boolean historyOfSmoking,
      @RequestParam(required = false) String doctorName,
      @RequestParam(required = false) String reviewStatus,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "created_at,desc") String sort) {

    Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
    if (sort != null && !sort.isBlank()) {
      String[] parts = sort.split(",");
      String prop = parts[0].trim();
      Sort.Direction dir = parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
      if (prop.equals("lastExamDate") || prop.equals("riskScore") || prop.equals("fullName") || prop.equals("createdAt")) {
        sortObj = Sort.by(dir, prop);
      }
    }

    Pageable pageable = PageRequest.of(page, size, sortObj);
    Page<PatientProfileDto> patientPage =
        patientService.searchPatients(
            search,
            risk,
            minScore,
            maxScore,
            hasDiabetes,
            hasHypertension,
            historyOfSmoking,
            doctorName,
            reviewStatus,
            pageable);

    return ApiResponse.success(PageResponse.from(patientPage));
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Get detailed patient profile by UUID")
  public ApiResponse<PatientProfileDto> getPatientById(@PathVariable UUID id) {
    return ApiResponse.success(patientService.getPatientById(id));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Create a new patient record in PostgreSQL")
  public ApiResponse<PatientProfileDto> createPatient(@RequestBody PatientProfile patient) {
    return ApiResponse.success("Tạo hồ sơ bệnh nhân thành công", patientService.createPatient(patient));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
  @Operation(summary = "Update patient record in PostgreSQL")
  public ApiResponse<PatientProfileDto> updatePatient(
      @PathVariable UUID id, @RequestBody PatientProfile patient) {
    return ApiResponse.success("Cập nhật hồ sơ bệnh nhân thành công", patientService.updatePatient(id, patient));
  }
}
