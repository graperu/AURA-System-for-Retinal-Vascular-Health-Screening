package com.aura.patient.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.patient.dto.PatientProfileResponse;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.service.PatientProfileService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patient/profile")
public class PatientProfileController {

  private final PatientProfileService profileService;

  public PatientProfileController(PatientProfileService profileService) {
    this.profileService = profileService;
  }

  @GetMapping
  public ApiResponse<PatientProfileResponse> getMyProfile(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    UUID userId = principal != null ? principal.id() : UUID.fromString("11111111-1111-1111-1111-111111111111");
    PatientProfileResponse response = profileService.getOrCreateProfile(userId);
    return ApiResponse.success("Lấy thông tin hồ sơ y tế thành công", response);
  }

  @PutMapping
  public ApiResponse<PatientProfileResponse> updateMyProfile(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody UpdatePatientProfileRequest request) {
    UUID userId = principal != null ? principal.id() : UUID.fromString("11111111-1111-1111-1111-111111111111");
    PatientProfileResponse response = profileService.updateProfile(userId, request);
    return ApiResponse.success("Cập nhật thông tin cá nhân và tiền sử y tế thành công", response);
  }

  @GetMapping("/{patientId}")
  @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'CLINIC')")
  public ApiResponse<PatientProfileResponse> getPatientProfileById(
      @PathVariable UUID patientId) {
    PatientProfileResponse response = profileService.getProfileByPatientId(patientId);
    return ApiResponse.success("Tra cứu thông tin hồ sơ bệnh nhân thành công", response);
  }
}
