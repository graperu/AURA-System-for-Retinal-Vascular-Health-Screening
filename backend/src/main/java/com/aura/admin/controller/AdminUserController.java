package com.aura.admin.controller;

import com.aura.admin.dto.AiConfigDto;
import com.aura.audit.annotation.Audited;
import com.aura.admin.dto.AssignmentBoardResponse;
import com.aura.admin.dto.BulkPatientAssignmentRequest;
import com.aura.admin.dto.UpdateUserRequest;
import com.aura.admin.dto.UpdateUserRoleRequest;
import com.aura.admin.dto.UpdateUserStatusRequest;
import com.aura.admin.dto.UserSummaryDto;
import com.aura.admin.service.AdminPatientAssignmentService;
import com.aura.admin.service.AdminUserService;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import com.aura.role.enums.RoleName;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Management", description = "Endpoints for user management, clinic approvals, and AI config (FR-31, FR-32, FR-33, FR-38)")
public class AdminUserController {

  private final AdminUserService adminUserService;
  private final AdminPatientAssignmentService assignmentService;

  public AdminUserController(
      AdminUserService adminUserService,
      AdminPatientAssignmentService assignmentService) {
    this.adminUserService = adminUserService;
    this.assignmentService = assignmentService;
  }

  @GetMapping("/users")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "List all registered accounts with roles (FR-31)")
  public ApiResponse<PageResponse<UserSummaryDto>> getAllUsers(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) RoleName role) {
    Pageable pageable = PageRequest.of(page, size);
    Page<UserSummaryDto> users = adminUserService.getAllUsers(q, role, pageable);
    return ApiResponse.success(PageResponse.from(users));
  }

  @Audited(action = "ADMIN_USER_UPDATE", module = "ADMIN", resourceType = "USER", description = "Quản trị viên cập nhật thông tin tài khoản")
  @PutMapping("/users/{userId}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Edit user, doctor or clinic account profile (FR-31)")
  public ApiResponse<UserSummaryDto> updateUser(
      @PathVariable UUID userId, @Valid @RequestBody UpdateUserRequest request) {
    return ApiResponse.success("Đã cập nhật thông tin tài khoản", adminUserService.updateUser(userId, request));
  }

  @Audited(action = "ADMIN_USER_STATUS_CHANGE", module = "ADMIN", resourceType = "USER", description = "Quản trị viên thay đổi trạng thái kích hoạt tài khoản")
  @RequestMapping(value = "/users/{userId}/status", method = {RequestMethod.PUT, RequestMethod.PATCH})
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Enable or disable a user/doctor/clinic account (FR-31)")
  public ApiResponse<UserSummaryDto> updateUserStatus(
      @PathVariable UUID userId,
      @Valid @RequestBody UpdateUserStatusRequest request) {
    return ApiResponse.success(adminUserService.updateUserStatus(userId, request));
  }

  @Audited(action = "ADMIN_ROLE_UPDATE", module = "ADMIN", resourceType = "USER", description = "Quản trị viên thay đổi vai trò tài khoản")
  @RequestMapping(value = "/users/{userId}/role", method = {RequestMethod.PUT, RequestMethod.PATCH})
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Assign a system role to an account (FR-32)")
  public ApiResponse<UserSummaryDto> updateUserRole(
      @PathVariable UUID userId, @Valid @RequestBody UpdateUserRoleRequest request) {
    return ApiResponse.success("Đã cập nhật vai trò người dùng", adminUserService.updateUserRole(userId, request));
  }

  @Audited(action = "ADMIN_CLINIC_APPROVE", module = "ADMIN", resourceType = "CLINIC", description = "Quản trị viên phê duyệt phòng khám")
  @PutMapping("/clinics/{clinicId}/approve")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Approve a clinic registration")
  public ApiResponse<UserSummaryDto> approveClinic(@PathVariable UUID clinicId) {
    return ApiResponse.success(
        adminUserService.updateUserStatus(clinicId, new UpdateUserStatusRequest(true)));
  }

  @Audited(action = "ADMIN_CLINIC_SUSPEND", module = "ADMIN", resourceType = "CLINIC", description = "Quản trị viên tạm dừng tài khoản phòng khám")
  @PutMapping("/clinics/{clinicId}/suspend")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Suspend a clinic organization account")
  public ApiResponse<UserSummaryDto> suspendClinic(@PathVariable UUID clinicId) {
    return ApiResponse.success(
        adminUserService.updateUserStatus(clinicId, new UpdateUserStatusRequest(false)));
  }

  @GetMapping("/ai-config")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Get global AI parameters and threshold configuration")
  public ApiResponse<AiConfigDto> getAiConfig() {
    return ApiResponse.success(adminUserService.getAiConfig());
  }

  @Audited(action = "ADMIN_AI_CONFIG_UPDATE", module = "ADMIN", resourceType = "AI_CONFIG", description = "Quản trị viên cập nhật cấu hình ngưỡng AI")
  @PutMapping("/ai-config")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Update global AI sensitivity, thresholds and retraining policy")
  public ApiResponse<AiConfigDto> updateAiConfig(
      @RequestBody AiConfigDto update,
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal != null && principal.email() != null) {
      return ApiResponse.success(adminUserService.updateAiConfig(update, principal.email()));
    }
    return ApiResponse.success(adminUserService.updateAiConfig(update));
  }

  public ApiResponse<AiConfigDto> updateAiConfig(AiConfigDto update) {
    return ApiResponse.success(adminUserService.updateAiConfig(update));
  }

  @GetMapping("/patient-assignments")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Get the doctor-patient assignment board")
  public ApiResponse<AssignmentBoardResponse> getPatientAssignments() {
    return ApiResponse.success(assignmentService.getBoard());
  }

  @Audited(action = "ADMIN_PATIENT_ASSIGN", module = "ADMIN", resourceType = "ASSIGNMENT", description = "Quản trị viên phân công bệnh nhân cho bác sĩ")
  @PutMapping("/patient-assignments")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Assign one or more patients to a doctor")
  public ApiResponse<AssignmentBoardResponse> assignPatients(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody BulkPatientAssignmentRequest request) {
    return ApiResponse.success("Phân công bệnh nhân thành công",
        assignmentService.assign(request, principal.id()));
  }

  @Audited(action = "ADMIN_PATIENT_UNASSIGN", module = "ADMIN", resourceType = "ASSIGNMENT", description = "Quản trị viên hủy phân công bệnh nhân")
  @DeleteMapping("/patient-assignments/{doctorId}/{patientId}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Remove a patient from a doctor's active worklist")
  public ApiResponse<AssignmentBoardResponse> unassignPatient(
      @PathVariable UUID doctorId,
      @PathVariable UUID patientId) {
    return ApiResponse.success("Hủy phân công bệnh nhân thành công",
        assignmentService.unassign(doctorId, patientId));
  }
}
