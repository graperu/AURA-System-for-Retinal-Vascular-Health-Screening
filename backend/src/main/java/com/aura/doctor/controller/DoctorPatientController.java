package com.aura.doctor.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.PageResponse;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/doctor/patients")
@Tag(name = "Doctor Patient Management", description = "Endpoints for Doctor Patient Worklist, Search, Filter & Pagination (FR-13, FR-18)")
public class DoctorPatientController {

  private final DoctorPatientAssignmentService assignmentService;
  private final PatientProfileService profileService;
  private final ScreeningService screeningService;

  public DoctorPatientController(
      DoctorPatientAssignmentService assignmentService,
      PatientProfileService profileService,
      ScreeningService screeningService) {
    this.assignmentService = assignmentService;
    this.profileService = profileService;
    this.screeningService = screeningService;
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Get paginated patients with dynamic filter and search (FR-18)")
  public ApiResponse<?> getPatients(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String risk,
      @RequestParam(required = false) Integer minScore,
      @RequestParam(required = false) Integer maxScore,
      @RequestParam(required = false) Boolean hasDiabetes,
      @RequestParam(required = false) Boolean hasHypertension,
      @RequestParam(required = false) Boolean historyOfSmoking,
      @RequestParam(required = false) String doctorName,
      @RequestParam(required = false) String reviewStatus,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sort,
      @AuthenticationPrincipal AuraUserPrincipal principal) {

    // If pagination or filter query params provided (e.g. from DoctorPatientListPage)
    if (page != null || size != null || search != null || risk != null || hasDiabetes != null || hasHypertension != null || historyOfSmoking != null) {
      int pageNum = page != null ? page : 0;
      int pageSize = size != null ? size : 10;
      Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
      if (sort != null && !sort.isBlank()) {
        String[] parts = sort.split(",");
        String prop = parts[0].trim();
        Sort.Direction dir = parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        if (prop.equals("lastExamDate") || prop.equals("riskScore") || prop.equals("fullName") || prop.equals("createdAt")) {
          sortObj = Sort.by(dir, prop);
        }
      }
      Pageable pageable = PageRequest.of(pageNum, pageSize, sortObj);
      Page<PatientProfileDto> patientPage = profileService.searchPatients(
          search, risk, minScore, maxScore, hasDiabetes, hasHypertension, historyOfSmoking, doctorName, reviewStatus, pageable);
      return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
    }

    // Default: Check assigned patients first
    if (principal != null) {
      List<DoctorPatientSummaryResponse> list = assignmentService.getAssignedPatients(principal.id());
      if (list != null && !list.isEmpty()) {
        return ApiResponse.success("Lấy danh sách bệnh nhân được phân công thành công", list);
      }
    }

    // If no specific assignment, return default paginated patient profiles
    Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<PatientProfileDto> patientPage = profileService.searchPatients(
        null, null, null, null, null, null, null, null, null, pageable);
    return ApiResponse.success("Lấy danh sách bệnh nhân thành công", PageResponse.from(patientPage));
  }

  @PostMapping
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create new patient profile")
  public ApiResponse<PatientProfileDto> createPatient(@RequestBody PatientProfile patient) {
    PatientProfileDto created = profileService.createPatient(patient);
    return ApiResponse.success("Tạo hồ sơ bệnh nhân mới thành công", created);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  @Operation(summary = "Update patient profile")
  public ApiResponse<PatientProfileDto> updatePatient(
      @PathVariable UUID id, @RequestBody PatientProfile patient) {
    PatientProfileDto updated = profileService.updatePatient(id, patient);
    return ApiResponse.success("Cập nhật hồ sơ bệnh nhân thành công", updated);
  }

  @GetMapping("/{patientId}")
  @PreAuthorize("hasRole('DOCTOR')")
  public ApiResponse<PatientProfileResponse> getAssignedPatientProfile(
      @PathVariable UUID patientId) {
    PatientProfileResponse response = profileService.getProfileByPatientId(patientId);
    return ApiResponse.success("Lấy thông tin hồ sơ bệnh nhân thành công", response);
  }

  @GetMapping("/{patientId}/screenings")
  @PreAuthorize("hasRole('DOCTOR')")
  public ApiResponse<List<Screening>> getAssignedPatientScreenings(
      @PathVariable UUID patientId) {
    List<Screening> screenings = screeningService.getScreeningsForPatient(patientId);
    return ApiResponse.success("Lấy lịch sử ca sàng lọc của bệnh nhân thành công", screenings);
  }

  @PostMapping("/{patientId}/screenings")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('DOCTOR')")
  public ApiResponse<Screening> createScreeningForAssignedPatient(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID patientId,
      @Valid @RequestBody CreateScreeningRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Bác sĩ");
    }
    Screening screening = screeningService.createScreening(patientId, request.imageUrl());
    return ApiResponse.success("Tạo ca sàng lọc cho bệnh nhân được phân công thành công", screening);
  }
}
