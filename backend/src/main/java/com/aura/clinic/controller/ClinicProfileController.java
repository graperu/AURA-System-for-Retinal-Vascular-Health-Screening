package com.aura.clinic.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.clinic.dto.ClinicProfileResponse;
import com.aura.clinic.dto.ReviewClinicProfileRequest;
import com.aura.clinic.dto.SubmitClinicProfileRequest;
import com.aura.clinic.entity.ClinicProfile;
import com.aura.clinic.entity.VerificationStatus;
import com.aura.clinic.service.ClinicProfileService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class ClinicProfileController {

  private final ClinicProfileService clinicProfileService;

  public ClinicProfileController(ClinicProfileService clinicProfileService) {
    this.clinicProfileService = clinicProfileService;
  }

  // --- FR-22: Phòng khám tự nộp / cập nhật hồ sơ đăng ký tổ chức ---

  @PostMapping("/api/v1/clinic/profile")
  @PreAuthorize("hasRole('CLINIC')")
  public ApiResponse<ClinicProfileResponse> submitProfile(
      @AuthenticationPrincipal AuraUserPrincipal principal, @Valid @RequestBody SubmitClinicProfileRequest request) {
    requireClinic(principal);
    ClinicProfile profile = clinicProfileService.submitOrUpdateProfile(principal.id(), request);
    return ApiResponse.success(
        "Đã nộp hồ sơ đăng ký tổ chức, đang chờ Quản trị viên xác minh", ClinicProfileResponse.from(profile));
  }

  @GetMapping("/api/v1/clinic/profile")
  @PreAuthorize("hasRole('CLINIC')")
  public ApiResponse<ClinicProfileResponse> getMyProfile(@AuthenticationPrincipal AuraUserPrincipal principal) {
    requireClinic(principal);
    ClinicProfile profile = clinicProfileService.getProfileByUserId(principal.id());
    return ApiResponse.success("Lấy hồ sơ phòng khám thành công", ClinicProfileResponse.from(profile));
  }

  // --- Admin: duyệt hồ sơ phòng khám ---

  @GetMapping("/api/v1/admin/clinics")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<List<ClinicProfileResponse>> listClinics(
      @RequestParam(required = false) VerificationStatus status) {
    List<ClinicProfileResponse> list =
        clinicProfileService.getProfilesByStatus(status).stream().map(ClinicProfileResponse::from).toList();
    return ApiResponse.success("Lấy danh sách hồ sơ phòng khám thành công", list);
  }

  @PatchMapping("/api/v1/admin/clinics/{clinicProfileId}/verify")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.OK)
  public ApiResponse<ClinicProfileResponse> reviewClinic(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID clinicProfileId,
      @Valid @RequestBody ReviewClinicProfileRequest request) {
    boolean approve = "APPROVED".equals(request.decision());
    ClinicProfile profile =
        clinicProfileService.review(clinicProfileId, approve, request.rejectionReason(), principal.id());
    return ApiResponse.success(
        approve ? "Đã phê duyệt hồ sơ phòng khám" : "Đã từ chối hồ sơ phòng khám",
        ClinicProfileResponse.from(profile));
  }

  private void requireClinic(AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Phòng khám");
    }
  }
}
