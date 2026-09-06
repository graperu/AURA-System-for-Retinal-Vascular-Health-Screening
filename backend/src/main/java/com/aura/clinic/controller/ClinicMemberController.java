package com.aura.clinic.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.clinic.dto.AddClinicMemberRequest;
import com.aura.clinic.dto.ClinicMemberResponse;
import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.service.ClinicMemberService;
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
@RequestMapping("/api/v1/clinic/members")
public class ClinicMemberController {

  private final ClinicMemberService clinicMemberService;

  public ClinicMemberController(ClinicMemberService clinicMemberService) {
    this.clinicMemberService = clinicMemberService;
  }

  @GetMapping
  @PreAuthorize("hasRole('CLINIC')")
  public ApiResponse<List<ClinicMemberResponse>> listMembers(@AuthenticationPrincipal AuraUserPrincipal principal) {
    requireClinic(principal);
    List<ClinicMemberResponse> list =
        clinicMemberService.getMembers(principal.id()).stream().map(ClinicMemberResponse::from).toList();
    return ApiResponse.success("Lấy danh sách bác sĩ trực thuộc phòng khám thành công", list);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('CLINIC')")
  public ApiResponse<ClinicMemberResponse> addMember(
      @AuthenticationPrincipal AuraUserPrincipal principal, @Valid @RequestBody AddClinicMemberRequest request) {
    requireClinic(principal);
    ClinicMember member = clinicMemberService.addDoctor(principal.id(), request.doctorEmail());
    return ApiResponse.success("Đã thêm bác sĩ vào phòng khám", ClinicMemberResponse.from(member));
  }

  @DeleteMapping("/{memberId}")
  @PreAuthorize("hasRole('CLINIC')")
  public ApiResponse<Void> removeMember(
      @AuthenticationPrincipal AuraUserPrincipal principal, @PathVariable UUID memberId) {
    requireClinic(principal);
    clinicMemberService.removeDoctor(principal.id(), memberId);
    return ApiResponse.success("Đã gỡ bác sĩ khỏi phòng khám", null);
  }

  @PostMapping("/{doctorId}/patients/{patientId}")
  @PreAuthorize("hasRole('CLINIC')")
  public ApiResponse<Void> assignPatientToDoctor(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID doctorId,
      @PathVariable UUID patientId) {
    requireClinic(principal);
    clinicMemberService.assignPatientToOwnDoctor(principal.id(), doctorId, patientId, principal.id());
    return ApiResponse.success("Đã phân công bệnh nhân cho bác sĩ thành công", null);
  }

  private void requireClinic(AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Phòng khám");
    }
  }
}
