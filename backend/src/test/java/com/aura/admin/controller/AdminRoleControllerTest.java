package com.aura.admin.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.admin.dto.PermissionDto;
import com.aura.admin.dto.RoleDto;
import com.aura.admin.dto.UpdateRolePermissionsRequest;
import com.aura.admin.dto.UpdateRoleRequest;
import com.aura.admin.service.AdminRoleService;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.role.enums.RoleName;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AdminRoleControllerTest {

  @Mock
  private AdminRoleService adminRoleService;

  @InjectMocks
  private AdminRoleController controller;

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  private UUID sampleRoleId;
  private RoleDto sampleDoctorRoleDto;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();
    objectMapper = new ObjectMapper();

    sampleRoleId = UUID.randomUUID();
    sampleDoctorRoleDto = new RoleDto(
        sampleRoleId,
        RoleName.DOCTOR,
        "Bác sĩ chuyên khoa lâm sàng CDS",
        Instant.now(),
        List.of(
            new PermissionDto(UUID.randomUUID(), "PERM_SCREENING_REVIEW", "Thẩm định ca sàng lọc", true),
            new PermissionDto(UUID.randomUUID(), "PERM_CONSULTATION_CHAT", "Tư vấn trực tiếp với bệnh nhân", true)
        )
    );
  }

  @Nested
  @DisplayName("GET /api/v1/admin/roles - Lấy danh mục vai trò và bảng quyền hạn (FR-32)")
  class ListRolesTests {

    @Test
    @DisplayName("Lấy danh sách các vai trò hệ thống thành công -> HTTP 200")
    void listRoles_success() throws Exception {
      when(adminRoleService.listRoles()).thenReturn(List.of(sampleDoctorRoleDto));

      mockMvc.perform(get("/api/v1/admin/roles"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].name").value("DOCTOR"))
          .andExpect(jsonPath("$.data[0].permissions").isArray())
          .andExpect(jsonPath("$.data[0].permissions[0].code").value("PERM_SCREENING_REVIEW"));

      verify(adminRoleService).listRoles();
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/admin/roles/{roleName} - Cập nhật mô tả vai trò")
  class UpdateRoleTests {

    @Test
    @DisplayName("Cập nhật mô tả vai trò thành công -> HTTP 200")
    void updateRole_success() throws Exception {
      UpdateRoleRequest request = new UpdateRoleRequest("Mô tả mới cho vai trò bác sĩ");
      RoleDto updatedDto = new RoleDto(
          sampleRoleId,
          RoleName.DOCTOR,
          "Mô tả mới cho vai trò bác sĩ",
          Instant.now(),
          sampleDoctorRoleDto.permissions()
      );
      when(adminRoleService.updateRole(eq(RoleName.DOCTOR), any(UpdateRoleRequest.class)))
          .thenReturn(updatedDto);

      mockMvc.perform(put("/api/v1/admin/roles/{roleName}", "DOCTOR")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.description").value("Mô tả mới cho vai trò bác sĩ"));

      verify(adminRoleService).updateRole(eq(RoleName.DOCTOR), any(UpdateRoleRequest.class));
    }

    @Test
    @DisplayName("Cập nhật thất bại khi vai trò không tồn tại -> HTTP 404 RESOURCE_NOT_FOUND")
    void updateRole_notFound() throws Exception {
      UpdateRoleRequest request = new UpdateRoleRequest("Mô tả");
      when(adminRoleService.updateRole(eq(RoleName.USER), any(UpdateRoleRequest.class)))
          .thenThrow(new ResourceNotFoundException("Không tìm thấy vai trò USER"));

      mockMvc.perform(put("/api/v1/admin/roles/{roleName}", "USER")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.code").value(ErrorCode.RESOURCE_NOT_FOUND.name()));
    }

    @Test
    @DisplayName("Cập nhật thất bại khi mô tả vượt quá 255 ký tự -> HTTP 400 VALIDATION_ERROR")
    void updateRole_validationError_tooLong() throws Exception {
      UpdateRoleRequest invalidRequest = new UpdateRoleRequest("A".repeat(256));

      mockMvc.perform(put("/api/v1/admin/roles/{roleName}", "DOCTOR")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/admin/roles/{roleName}/permissions - Cập nhật danh sách quyền hạn vai trò")
  class UpdatePermissionsTests {

    @Test
    @DisplayName("Bật/tắt quyền hạn vai trò thành công -> HTTP 200")
    void updatePermissions_success() throws Exception {
      UpdateRolePermissionsRequest request = new UpdateRolePermissionsRequest(
          List.of(
              new UpdateRolePermissionsRequest.PermissionToggle(null, "PERM_SCREENING_REVIEW", true),
              new UpdateRolePermissionsRequest.PermissionToggle(null, "PERM_CONSULTATION_CHAT", false)
          )
      );
      when(adminRoleService.updatePermissions(eq(RoleName.DOCTOR), any(UpdateRolePermissionsRequest.class)))
          .thenReturn(sampleDoctorRoleDto);

      mockMvc.perform(put("/api/v1/admin/roles/{roleName}/permissions", "DOCTOR")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.message").value("Đã cập nhật quyền truy cập"));

      verify(adminRoleService).updatePermissions(eq(RoleName.DOCTOR), any(UpdateRolePermissionsRequest.class));
    }

    @Test
    @DisplayName("Cập nhật quyền thất bại do danh sách permissions null -> HTTP 400 VALIDATION_ERROR")
    void updatePermissions_validationError_nullPermissions() throws Exception {
      String json = "{\"permissions\": null}";

      mockMvc.perform(put("/api/v1/admin/roles/{roleName}/permissions", "DOCTOR")
              .contentType(MediaType.APPLICATION_JSON)
              .content(json))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Test
  @DisplayName("Direct method coverage test")
  void directMethodCoverage_test() {
    when(adminRoleService.listRoles()).thenReturn(List.of(sampleDoctorRoleDto));
    ApiResponse<List<RoleDto>> response = controller.listRoles();
    assertThat(response.data()).hasSize(1);
    assertThat(response.data().get(0).name()).isEqualTo(RoleName.DOCTOR);

    UpdateRoleRequest req = new UpdateRoleRequest("Doctor role");
    when(adminRoleService.updateRole(eq(RoleName.DOCTOR), eq(req))).thenReturn(sampleDoctorRoleDto);
    ApiResponse<RoleDto> updateRes = controller.updateRole(RoleName.DOCTOR, req);
    assertThat(updateRes.data().name()).isEqualTo(RoleName.DOCTOR);
  }
}
