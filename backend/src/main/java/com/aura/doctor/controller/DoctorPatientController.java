package com.aura.doctor.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.doctor.dto.DoctorPatientSummaryResponse;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.service.PatientProfileService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.Screening;
import com.aura.screening.service.ScreeningService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/doctor/patients")
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
  @PreAuthorize("hasRole('DOCTOR')")
  public ApiResponse<List<DoctorPatientSummaryResponse>> getMyAssignedPatients(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Bác sĩ");
    }
    List<DoctorPatientSummaryResponse> list = assignmentService.getAssignedPatients(principal.id());
    return ApiResponse.success("Lấy danh sách bệnh nhân được phân công thành công", list);
  }

  @GetMapping("/{patientId}")
  @PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<PatientProfileResponse> getAssignedPatientProfile(
      @PathVariable UUID patientId) {
    PatientProfileResponse response = profileService.getProfileByPatientId(patientId);
    return ApiResponse.success("Lấy thông tin hồ sơ bệnh nhân thành công", response);
  }

  @GetMapping("/{patientId}/screenings")
  @PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canAccessPatient(principal, #patientId)")
  public ApiResponse<List<Screening>> getAssignedPatientScreenings(
      @PathVariable UUID patientId) {
    List<Screening> screenings = screeningService.getScreeningsForPatient(patientId);
    return ApiResponse.success("Lấy lịch sử ca sàng lọc của bệnh nhân thành công", screenings);
  }

  @PostMapping("/{patientId}/screenings")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('DOCTOR') && @patientAccessService.canAccessPatient(principal, #patientId)")
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
