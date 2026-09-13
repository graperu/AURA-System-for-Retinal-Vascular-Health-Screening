package com.aura.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.RoleDto;
import com.aura.admin.dto.UpdateRolePermissionsRequest;
import com.aura.admin.dto.UpdateRolePermissionsRequest.PermissionToggle;
import com.aura.admin.dto.UpdateRoleRequest;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.role.entity.Role;
import com.aura.role.entity.RolePermission;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RolePermissionRepository;
import com.aura.role.repository.RoleRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminRoleServiceTest {

  @Mock private RoleRepository roleRepository;
  @Mock private RolePermissionRepository permissionRepository;

  @InjectMocks private AdminRoleService adminRoleService;

  private Role doctorRole;
  private Role adminRole;
  private RolePermission permView;
  private RolePermission permEdit;
  private UUID permViewId;
  private UUID permEditId;

  @BeforeEach
  void setUp() {
    doctorRole = new Role();
    ReflectionTestUtils.setField(doctorRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(doctorRole, "name", RoleName.DOCTOR);
    doctorRole.setDescription("Bác sĩ chuyên khoa");

    adminRole = new Role();
    ReflectionTestUtils.setField(adminRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(adminRole, "name", RoleName.ADMIN);
    adminRole.setDescription("Quản trị hệ thống");

    permViewId = UUID.randomUUID();
    permView = new RolePermission(RoleName.DOCTOR, "PATIENT_VIEW", "Xem hồ sơ bệnh nhân", true);
    ReflectionTestUtils.setField(permView, "id", permViewId);

    permEditId = UUID.randomUUID();
    permEdit = new RolePermission(RoleName.DOCTOR, "PATIENT_EDIT", "Sửa hồ sơ bệnh nhân", false);
    ReflectionTestUtils.setField(permEdit, "id", permEditId);
  }

  @Nested
  @DisplayName("listRoles tests")
  class ListRolesTests {

    @Test
    @DisplayName("listRoles returns sorted list of roles with grouped permissions")
    void listRoles_Success() {
      // Arrange
      when(permissionRepository.findAllByOrderByRoleNameAscPermissionCodeAsc())
          .thenReturn(List.of(permView, permEdit));
      when(roleRepository.findAll()).thenReturn(List.of(doctorRole, adminRole));

      // Act
      List<RoleDto> result = adminRoleService.listRoles();

      // Assert
      assertThat(result).hasSize(2);
      // Sorted alphabetically by role name: ADMIN before DOCTOR
      assertThat(result.get(0).name()).isEqualTo(RoleName.ADMIN);
      assertThat(result.get(0).permissions()).isEmpty();

      assertThat(result.get(1).name()).isEqualTo(RoleName.DOCTOR);
      assertThat(result.get(1).permissions()).hasSize(2);
      assertThat(result.get(1).permissions().get(0).code()).isEqualTo("PATIENT_VIEW");
      assertThat(result.get(1).permissions().get(0).enabled()).isTrue();
    }
  }

  @Nested
  @DisplayName("updateRole tests")
  class UpdateRoleTests {

    @Test
    @DisplayName("updateRole updates description and returns updated RoleDto")
    void updateRole_Success() {
      // Arrange
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));
      when(roleRepository.save(doctorRole)).thenReturn(doctorRole);
      when(permissionRepository.findByRoleNameOrderByPermissionCodeAsc(RoleName.DOCTOR))
          .thenReturn(List.of(permView));

      // Act
      RoleDto result = adminRoleService.updateRole(RoleName.DOCTOR, new UpdateRoleRequest("  Mô tả bác sĩ mới  "));

      // Assert
      assertThat(result).isNotNull();
      assertThat(doctorRole.getDescription()).isEqualTo("Mô tả bác sĩ mới");
      verify(roleRepository).save(doctorRole);
    }

    @Test
    @DisplayName("updateRole with null description does not alter existing description")
    void updateRole_NullDescription_PreservesOriginal() {
      // Arrange
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));
      when(roleRepository.save(doctorRole)).thenReturn(doctorRole);
      when(permissionRepository.findByRoleNameOrderByPermissionCodeAsc(RoleName.DOCTOR))
          .thenReturn(List.of(permView));

      // Act
      RoleDto result = adminRoleService.updateRole(RoleName.DOCTOR, new UpdateRoleRequest(null));

      // Assert
      assertThat(result).isNotNull();
      assertThat(doctorRole.getDescription()).isEqualTo("Bác sĩ chuyên khoa");
      verify(roleRepository).save(doctorRole);
    }

    @Test
    @DisplayName("updateRole throws ResourceNotFoundException when role does not exist")
    void updateRole_NotFound_ThrowsException() {
      // Arrange
      when(roleRepository.findByName(RoleName.CLINIC)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> adminRoleService.updateRole(RoleName.CLINIC, new UpdateRoleRequest("Mô tả")))
          .isInstanceOfSatisfying(ResourceNotFoundException.class, e -> {
            assertThat(e.getMessage()).contains("Không tìm thấy vai trò CLINIC");
          });
      verify(roleRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("updatePermissions tests")
  class UpdatePermissionsTests {

    @Test
    @DisplayName("updatePermissions by permission ID toggles enabled state")
    void updatePermissions_ById_Success() {
      // Arrange
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));
      when(permissionRepository.findByRoleNameOrderByPermissionCodeAsc(RoleName.DOCTOR))
          .thenReturn(List.of(permView, permEdit));

      var toggle = new PermissionToggle(permEditId, null, true);
      var request = new UpdateRolePermissionsRequest(List.of(toggle));

      // Act
      RoleDto result = adminRoleService.updatePermissions(RoleName.DOCTOR, request);

      // Assert
      assertThat(result).isNotNull();
      assertThat(permEdit.isEnabled()).isTrue();
      verify(permissionRepository).saveAll(argThat(list -> {
        List<RolePermission> items = (List<RolePermission>) list;
        return items.size() == 1 && items.get(0).getId().equals(permEditId) && items.get(0).isEnabled();
      }));
    }

    @Test
    @DisplayName("updatePermissions by permission Code (case-insensitive) toggles enabled state")
    void updatePermissions_ByCode_Success() {
      // Arrange
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));
      when(permissionRepository.findByRoleNameOrderByPermissionCodeAsc(RoleName.DOCTOR))
          .thenReturn(List.of(permView, permEdit));

      var toggle = new PermissionToggle(null, "patient_view", false);
      var request = new UpdateRolePermissionsRequest(List.of(toggle));

      // Act
      RoleDto result = adminRoleService.updatePermissions(RoleName.DOCTOR, request);

      // Assert
      assertThat(result).isNotNull();
      assertThat(permView.isEnabled()).isFalse();
      verify(permissionRepository).saveAll(argThat(list -> {
        List<RolePermission> items = (List<RolePermission>) list;
        return items.size() == 1 && items.get(0).getId().equals(permViewId) && !items.get(0).isEnabled();
      }));
    }

    @Test
    @DisplayName("updatePermissions throws ResourceNotFoundException when role does not exist")
    void updatePermissions_RoleNotFound_ThrowsException() {
      // Arrange
      when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.empty());

      // Act & Assert
      var request = new UpdateRolePermissionsRequest(List.of(new PermissionToggle(permViewId, null, true)));
      assertThatThrownBy(() -> adminRoleService.updatePermissions(RoleName.USER, request))
          .isInstanceOf(ResourceNotFoundException.class);
      verify(permissionRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("updatePermissions throws ResourceNotFoundException when permission not found in role")
    void updatePermissions_PermissionNotFound_ThrowsException() {
      // Arrange
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));
      when(permissionRepository.findByRoleNameOrderByPermissionCodeAsc(RoleName.DOCTOR))
          .thenReturn(List.of(permView, permEdit));

      var unknownToggle = new PermissionToggle(UUID.randomUUID(), "UNKNOWN_PERM", true);
      var request = new UpdateRolePermissionsRequest(List.of(unknownToggle));

      // Act & Assert
      assertThatThrownBy(() -> adminRoleService.updatePermissions(RoleName.DOCTOR, request))
          .isInstanceOfSatisfying(ResourceNotFoundException.class, e -> {
            assertThat(e.getMessage()).contains("Không tìm thấy quyền trong vai trò DOCTOR");
          });
      verify(permissionRepository, never()).saveAll(any());
    }
  }
}
