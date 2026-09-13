package com.aura.admin.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.AiConfigDto;
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
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerUnitTest {

  @Mock
  private AdminUserService adminUserService;

  @Mock
  private AdminPatientAssignmentService assignmentService;

  private AdminUserController controller;

  private UUID adminId;
  private AuraUserPrincipal adminPrincipal;
  private UUID targetUserId;
  private UserSummaryDto sampleUserDto;

  @BeforeEach
  void setUp() {
    controller = new AdminUserController(adminUserService, assignmentService);

    adminId = UUID.randomUUID();
    adminPrincipal = new AuraUserPrincipal(adminId, "admin@aura.test", "secret", true, List.of("ROLE_ADMIN"));

    targetUserId = UUID.randomUUID();
    sampleUserDto = new UserSummaryDto(
        targetUserId, "user@aura.test", "Nguyễn Văn Người Dùng", true, true,
        Set.of("ROLE_USER"), Instant.now()
    );
  }

  @Nested
  @DisplayName("GET /api/v1/admin/users - Danh sách người dùng (FR-31)")
  class GetAllUsersTests {

    @Test
    @DisplayName("Thành công: Lấy danh sách người dùng phân trang")
    void getAllUsers_success() {
      Page<UserSummaryDto> page = new PageImpl<>(List.of(sampleUserDto), PageRequest.of(0, 20), 1);
      when(adminUserService.getAllUsers(eq("user"), eq(RoleName.USER), any(Pageable.class)))
          .thenReturn(page);

      ApiResponse<PageResponse<UserSummaryDto>> response =
          controller.getAllUsers(0, 20, "user", RoleName.USER);

      assertThat(response).isNotNull();
      assertThat(response.data()).isNotNull();
      assertThat(response.data().items()).hasSize(1);
      assertThat(response.data().items().get(0).email()).isEqualTo("user@aura.test");
      verify(adminUserService).getAllUsers(eq("user"), eq(RoleName.USER), any(Pageable.class));
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/admin/users/{userId} - Cập nhật thông tin tài khoản (FR-31)")
  class UpdateUserTests {

    @Test
    @DisplayName("Thành công: Admin cập nhật thông tin người dùng")
    void updateUser_success() {
      UpdateUserRequest req = new UpdateUserRequest("Nguyễn Văn Mới", "new@aura.test", true);
      UserSummaryDto updatedDto = new UserSummaryDto(
          targetUserId, "new@aura.test", "Nguyễn Văn Mới", true, true,
          Set.of("ROLE_USER"), Instant.now()
      );
      when(adminUserService.updateUser(eq(targetUserId), eq(req))).thenReturn(updatedDto);

      ApiResponse<UserSummaryDto> response = controller.updateUser(targetUserId, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã cập nhật thông tin tài khoản");
      assertThat(response.data().fullName()).isEqualTo("Nguyễn Văn Mới");
      verify(adminUserService).updateUser(eq(targetUserId), eq(req));
    }
  }

  @Nested
  @DisplayName("PUT/PATCH /api/v1/admin/users/{userId}/status - Kích hoạt hoặc vô hiệu hóa tài khoản (FR-31)")
  class UpdateUserStatusTests {

    @Test
    @DisplayName("Thành công: Cập nhật trạng thái kích hoạt tài khoản")
    void updateUserStatus_success() {
      UpdateUserStatusRequest req = new UpdateUserStatusRequest(false);
      UserSummaryDto disabledDto = new UserSummaryDto(
          targetUserId, "user@aura.test", "Nguyễn Văn Người Dùng", false, true,
          Set.of("ROLE_USER"), Instant.now()
      );
      when(adminUserService.updateUserStatus(eq(targetUserId), eq(req))).thenReturn(disabledDto);

      ApiResponse<UserSummaryDto> response = controller.updateUserStatus(targetUserId, req);

      assertThat(response).isNotNull();
      assertThat(response.data().active()).isFalse();
      verify(adminUserService).updateUserStatus(eq(targetUserId), eq(req));
    }
  }

  @Nested
  @DisplayName("PUT/PATCH /api/v1/admin/users/{userId}/role - Cập nhật vai trò người dùng (FR-32)")
  class UpdateUserRoleTests {

    @Test
    @DisplayName("Thành công: Gán vai trò bác sĩ cho tài khoản")
    void updateUserRole_success() {
      UpdateUserRoleRequest req = new UpdateUserRoleRequest(RoleName.DOCTOR);
      UserSummaryDto doctorDto = new UserSummaryDto(
          targetUserId, "user@aura.test", "BS. Nguyễn Văn Người Dùng", true, true,
          Set.of("ROLE_DOCTOR"), Instant.now()
      );
      when(adminUserService.updateUserRole(eq(targetUserId), eq(req))).thenReturn(doctorDto);

      ApiResponse<UserSummaryDto> response = controller.updateUserRole(targetUserId, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã cập nhật vai trò người dùng");
      assertThat(response.data().roles()).contains("ROLE_DOCTOR");
      verify(adminUserService).updateUserRole(eq(targetUserId), eq(req));
    }
  }

  @Nested
  @DisplayName("Phê duyệt và đình chỉ phòng khám (Approve / Suspend Clinic)")
  class ClinicApprovalTests {

    @Test
    @DisplayName("PUT /clinics/{clinicId}/approve - Phê duyệt phòng khám")
    void approveClinic_success() {
      UUID clinicId = UUID.randomUUID();
      when(adminUserService.updateUserStatus(eq(clinicId), any(UpdateUserStatusRequest.class)))
          .thenReturn(sampleUserDto);

      ApiResponse<UserSummaryDto> response = controller.approveClinic(clinicId);

      assertThat(response).isNotNull();
      ArgumentCaptor<UpdateUserStatusRequest> captor = ArgumentCaptor.forClass(UpdateUserStatusRequest.class);
      verify(adminUserService).updateUserStatus(eq(clinicId), captor.capture());
      assertThat(captor.getValue().active()).isTrue();
    }

    @Test
    @DisplayName("PUT /clinics/{clinicId}/suspend - Đình chỉ phòng khám")
    void suspendClinic_success() {
      UUID clinicId = UUID.randomUUID();
      when(adminUserService.updateUserStatus(eq(clinicId), any(UpdateUserStatusRequest.class)))
          .thenReturn(sampleUserDto);

      ApiResponse<UserSummaryDto> response = controller.suspendClinic(clinicId);

      assertThat(response).isNotNull();
      ArgumentCaptor<UpdateUserStatusRequest> captor = ArgumentCaptor.forClass(UpdateUserStatusRequest.class);
      verify(adminUserService).updateUserStatus(eq(clinicId), captor.capture());
      assertThat(captor.getValue().active()).isFalse();
    }
  }

  @Nested
  @DisplayName("Cấu hình AI (FR-38)")
  class AiConfigTests {

    @Test
    @DisplayName("GET /ai-config - Lấy cấu hình tham số AI hiện hành")
    void getAiConfig_success() {
      AiConfigDto config = new AiConfigDto("gemini-3.7-flash-high", 0.85, 0.90, 0.65, true, "2026-09-13");
      when(adminUserService.getAiConfig()).thenReturn(config);

      ApiResponse<AiConfigDto> response = controller.getAiConfig();

      assertThat(response).isNotNull();
      assertThat(response.data().activeModelVersion()).isEqualTo("gemini-3.7-flash-high");
      verify(adminUserService).getAiConfig();
    }

    @Test
    @DisplayName("PUT /ai-config - Cập nhật cấu hình tham số AI")
    void updateAiConfig_success() {
      AiConfigDto updateReq = new AiConfigDto("gemini-3.7-flash-high", 0.88, 0.92, 0.65, true, "2026-09-13");
      when(adminUserService.updateAiConfig(eq(updateReq))).thenReturn(updateReq);

      ApiResponse<AiConfigDto> response = controller.updateAiConfig(updateReq);

      assertThat(response).isNotNull();
      assertThat(response.data().sensitivityThreshold()).isEqualTo(0.88);
      verify(adminUserService).updateAiConfig(eq(updateReq));
    }
  }

  @Nested
  @DisplayName("Bảng phân công bác sĩ - bệnh nhân (FR-33)")
  class PatientAssignmentBoardTests {

    @Test
    @DisplayName("GET /patient-assignments - Lấy bảng phân công bác sĩ - bệnh nhân")
    void getPatientAssignments_success() {
      AssignmentBoardResponse board = new AssignmentBoardResponse(Collections.emptyList(), Collections.emptyList());
      when(assignmentService.getBoard()).thenReturn(board);

      ApiResponse<AssignmentBoardResponse> response = controller.getPatientAssignments();

      assertThat(response).isNotNull();
      assertThat(response.data()).isEqualTo(board);
      verify(assignmentService).getBoard();
    }

    @Test
    @DisplayName("PUT /patient-assignments - Phân công hàng loạt bệnh nhân cho bác sĩ")
    void assignPatients_success() {
      UUID doctorId = UUID.randomUUID();
      UUID patientId = UUID.randomUUID();
      BulkPatientAssignmentRequest req = new BulkPatientAssignmentRequest(doctorId, List.of(patientId), false);
      AssignmentBoardResponse board = new AssignmentBoardResponse(Collections.emptyList(), Collections.emptyList());
      when(assignmentService.assign(eq(req), eq(adminId))).thenReturn(board);

      ApiResponse<AssignmentBoardResponse> response = controller.assignPatients(adminPrincipal, req);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Phân công bệnh nhân thành công");
      verify(assignmentService).assign(eq(req), eq(adminId));
    }

    @Test
    @DisplayName("DELETE /patient-assignments/{doctorId}/{patientId} - Hủy phân công bệnh nhân khỏi bác sĩ")
    void unassignPatient_success() {
      UUID doctorId = UUID.randomUUID();
      UUID patientId = UUID.randomUUID();
      AssignmentBoardResponse board = new AssignmentBoardResponse(Collections.emptyList(), Collections.emptyList());
      when(assignmentService.unassign(eq(doctorId), eq(patientId))).thenReturn(board);

      ApiResponse<AssignmentBoardResponse> response = controller.unassignPatient(doctorId, patientId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Hủy phân công bệnh nhân thành công");
      verify(assignmentService).unassign(eq(doctorId), eq(patientId));
    }
  }
}
