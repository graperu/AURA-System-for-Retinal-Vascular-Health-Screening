package com.aura.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.UpdateUserRoleRequest;
import com.aura.admin.dto.UpdateUserStatusRequest;
import com.aura.admin.dto.UserSummaryDto;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserService - Optimized Sole Active Admin Protection Tests")
class AdminUserServiceOptimizedTest {

  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private RoleRepository roleRepository;

  private AdminUserService adminUserService;
  private UUID adminId;
  private User activeAdminUser;
  private Role adminRole;
  private Role doctorRole;

  private Role createRole(RoleName name) {
    Role role = new Role();
    ReflectionTestUtils.setField(role, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(role, "name", name);
    return role;
  }

  @BeforeEach
  void setUp() {
    adminUserService = new AdminUserService(userRepository, userRoleRepository, roleRepository);
    adminId = UUID.randomUUID();

    activeAdminUser = new User("sole.admin@aura.hospital", "hash_pass", "Sole Admin");
    ReflectionTestUtils.setField(activeAdminUser, "id", adminId);
    activeAdminUser.setActive(true);

    adminRole = createRole(RoleName.ADMIN);
    doctorRole = createRole(RoleName.DOCTOR);
  }

  @Test
  @DisplayName("updateUserStatus: Chặn vô hiệu hóa khi tài khoản là Quản trị viên đang hoạt động duy nhất (count <= 1)")
  void testBlockDeactivationOfSoleActiveAdmin() {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.existsByUserIdAndRole(adminId, RoleName.ADMIN)).thenReturn(true);
    when(userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(1L);

    UpdateUserStatusRequest deactivationRequest = new UpdateUserStatusRequest(false);

    assertThatThrownBy(() -> adminUserService.updateUserStatus(adminId, deactivationRequest))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Không thể vô hiệu hóa quản trị viên đang hoạt động cuối cùng");
  }

  @Test
  @DisplayName("updateUserStatus: Cho phép vô hiệu hóa admin khi có nhiều hơn 1 active admin (count > 1)")
  void testAllowDeactivationWhenMultipleActiveAdminsExist() {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.existsByUserIdAndRole(adminId, RoleName.ADMIN)).thenReturn(true);
    when(userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(2L);
    when(userRepository.save(any(User.class))).thenReturn(activeAdminUser);

    UpdateUserStatusRequest deactivationRequest = new UpdateUserStatusRequest(false);

    UserSummaryDto result = adminUserService.updateUserStatus(adminId, deactivationRequest);

    assertThat(result).isNotNull();
    assertThat(activeAdminUser.isActive()).isFalse();
    verify(userRepository).save(activeAdminUser);
  }

  @ParameterizedTest(name = "Demoting sole active admin to {0} must be blocked")
  @EnumSource(value = RoleName.class, names = {"USER", "DOCTOR", "CLINIC"})
  @DisplayName("updateUserRole: Chặn hạ vai trò của Quản trị viên đang hoạt động cuối cùng sang role khác")
  void testBlockRoleDemotionOfSoleActiveAdmin(RoleName targetNonAdminRole) {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.findAllByUserId(adminId))
        .thenReturn(List.of(new UserRole(activeAdminUser, adminRole)));
    when(userRoleRepository.existsByUserIdAndRole(adminId, RoleName.ADMIN)).thenReturn(true);
    when(userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(1L);

    UpdateUserRoleRequest roleRequest = new UpdateUserRoleRequest(targetNonAdminRole);

    assertThatThrownBy(() -> adminUserService.updateUserRole(adminId, roleRequest))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Không thể hạ vai trò quản trị viên đang hoạt động cuối cùng");
  }

  @Test
  @DisplayName("updateUserRole: Cho phép gán lại vai trò ADMIN cho sole active admin")
  void testAllowReassigningAdminRoleToSoleActiveAdmin() {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.findAllByUserId(adminId))
        .thenReturn(List.of(new UserRole(activeAdminUser, adminRole)));
    when(roleRepository.findByName(RoleName.ADMIN)).thenReturn(Optional.of(adminRole));

    UpdateUserRoleRequest roleRequest = new UpdateUserRoleRequest(RoleName.ADMIN);

    UserSummaryDto result = adminUserService.updateUserRole(adminId, roleRequest);

    assertThat(result).isNotNull();
    verify(userRoleRepository).deleteAllByUserId(adminId);
    verify(userRoleRepository).save(any(UserRole.class));
  }

  @Test
  @DisplayName("updateUserRole: Cho phép đổi role khi có từ 2 active admin trở lên trong hệ thống")
  void testAllowRoleDemotionWhenAnotherActiveAdminExists() {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.findAllByUserId(adminId))
        .thenReturn(List.of(new UserRole(activeAdminUser, adminRole)));
    when(userRoleRepository.existsByUserIdAndRole(adminId, RoleName.ADMIN)).thenReturn(true);
    when(userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(3L);
    when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));

    UpdateUserRoleRequest roleRequest = new UpdateUserRoleRequest(RoleName.DOCTOR);

    UserSummaryDto result = adminUserService.updateUserRole(adminId, roleRequest);

    assertThat(result).isNotNull();
    verify(userRoleRepository).deleteAllByUserId(adminId);
  }

  @Test
  @DisplayName("updateUserRole: Cho phép đổi role khi tài khoản admin đã bị vô hiệu hóa trước đó (active = false)")
  void testAllowRoleChangeWhenAdminIsInactive() {
    activeAdminUser.setActive(false);
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.findAllByUserId(adminId))
        .thenReturn(List.of(new UserRole(activeAdminUser, adminRole)));
    when(roleRepository.findByName(RoleName.USER)).thenReturn(Optional.of(createRole(RoleName.USER)));

    UpdateUserRoleRequest roleRequest = new UpdateUserRoleRequest(RoleName.USER);

    UserSummaryDto result = adminUserService.updateUserRole(adminId, roleRequest);

    assertThat(result).isNotNull();
    verify(userRoleRepository).deleteAllByUserId(adminId);
  }

  @Test
  @DisplayName("updateAiConfig: Cập nhật từng trường cấu hình AI đơn lẻ và đọc lại qua getAiConfig")
  void testUpdateAiConfigSingleFields() {
    // 1. Chỉ cập nhật activeModelVersion
    var res1 = adminUserService.updateAiConfig(new com.aura.admin.dto.AiConfigDto("v2.1-flash", null, null, null, null, null));
    assertThat(res1.activeModelVersion()).isEqualTo("v2.1-flash");
    assertThat(res1.lastUpdated()).isNotNull();

    // 2. Chỉ cập nhật sensitivityThreshold
    var res2 = adminUserService.updateAiConfig(new com.aura.admin.dto.AiConfigDto(null, 0.95, null, null, null, null));
    assertThat(res2.activeModelVersion()).isEqualTo("v2.1-flash");
    assertThat(res2.sensitivityThreshold()).isEqualTo(0.95);

    // 3. Chỉ cập nhật confidenceThreshold
    var res3 = adminUserService.updateAiConfig(new com.aura.admin.dto.AiConfigDto(null, null, 0.88, null, null, null));
    assertThat(res3.confidenceThreshold()).isEqualTo(0.88);

    // 4. Chỉ cập nhật avrWarningThreshold
    var res4 = adminUserService.updateAiConfig(new com.aura.admin.dto.AiConfigDto(null, null, null, 0.65, null, null));
    assertThat(res4.avrWarningThreshold()).isEqualTo(0.65);

    // 5. Chỉ cập nhật autoRetrainEnabled
    var res5 = adminUserService.updateAiConfig(new com.aura.admin.dto.AiConfigDto(null, null, null, null, true, null));
    assertThat(res5.autoRetrainEnabled()).isTrue();

    // 6. getAiConfig trả về đầy đủ các giá trị đã cập nhật
    var currentConfig = adminUserService.getAiConfig();
    assertThat(currentConfig.activeModelVersion()).isEqualTo("v2.1-flash");
    assertThat(currentConfig.sensitivityThreshold()).isEqualTo(0.95);
    assertThat(currentConfig.confidenceThreshold()).isEqualTo(0.88);
    assertThat(currentConfig.avrWarningThreshold()).isEqualTo(0.65);
    assertThat(currentConfig.autoRetrainEnabled()).isTrue();
  }

  @Test
  @DisplayName("updateUser: Ném lỗi khi fullName rỗng hoặc email bị trùng lặp")
  void testUpdateUserValidationFailures() {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));

    // FullName rỗng
    var reqEmptyName = new com.aura.admin.dto.UpdateUserRequest("   ", null, null);
    assertThatThrownBy(() -> adminUserService.updateUser(adminId, reqEmptyName))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Họ tên không được để trống");

    // Email trùng lặp
    when(userRepository.existsByEmailIgnoreCaseAndIdNot("duplicate@aura.ai", adminId)).thenReturn(true);
    var reqDupEmail = new com.aura.admin.dto.UpdateUserRequest(null, "duplicate@aura.ai", null);
    assertThatThrownBy(() -> adminUserService.updateUser(adminId, reqDupEmail))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Email đã được sử dụng bởi tài khoản khác");
  }

  @Test
  @DisplayName("updateUser: Cập nhật thành công khi email và emailVerified là null, hoặc fullName là null")
  void testUpdateUserPartialNullFields() {
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

    // 1. Chỉ cập nhật fullName, email & emailVerified là null
    var reqOnlyName = new com.aura.admin.dto.UpdateUserRequest("Admin Modified Name", null, null);
    var dto1 = adminUserService.updateUser(adminId, reqOnlyName);
    assertThat(dto1.fullName()).isEqualTo("Admin Modified Name");

    // 2. fullName là null, cập nhật email và emailVerified
    when(userRepository.existsByEmailIgnoreCaseAndIdNot("new.email@aura.ai", adminId)).thenReturn(false);
    var reqEmailAndVerified = new com.aura.admin.dto.UpdateUserRequest(null, "NEW.EMAIL@AURA.AI", true);
    var dto2 = adminUserService.updateUser(adminId, reqEmailAndVerified);
    assertThat(dto2.email()).isEqualTo("new.email@aura.ai");
  }

  @Test
  @DisplayName("getAllUsers: Tìm kiếm người dùng với query có khoảng trắng, lọc role và phân trang")
  void testGetAllUsersWithQueryAndRole() {
    var pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    when(userRepository.search("dr", RoleName.DOCTOR, pageable))
        .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(activeAdminUser), pageable, 1));

    var result = adminUserService.getAllUsers("  dr  ", RoleName.DOCTOR, pageable);
    assertThat(result.getTotalElements()).isEqualTo(1);

    // Query null
    when(userRepository.search(null, null, pageable))
        .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(activeAdminUser), pageable, 1));
    var resultNull = adminUserService.getAllUsers(null, null, pageable);
    assertThat(resultNull.getTotalElements()).isEqualTo(1);
  }

  @Test
  @DisplayName("AdminUserService: Ném ResourceNotFoundException khi userId hoặc role không tồn tại")
  void testUserOrRoleNotFoundExceptions() {
    UUID unknownId = UUID.randomUUID();
    when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> adminUserService.updateUserStatus(unknownId, new UpdateUserStatusRequest(true)))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);

    assertThatThrownBy(() -> adminUserService.updateUser(unknownId, new com.aura.admin.dto.UpdateUserRequest("Name", null, null)))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);

    assertThatThrownBy(() -> adminUserService.updateUserRole(unknownId, new UpdateUserRoleRequest(RoleName.USER)))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);

    // Role not found
    when(userRepository.findById(adminId)).thenReturn(Optional.of(activeAdminUser));
    when(userRoleRepository.findAllByUserId(adminId)).thenReturn(List.of(new UserRole(activeAdminUser, adminRole)));
    when(userRoleRepository.existsByUserIdAndRole(adminId, RoleName.ADMIN)).thenReturn(false);
    when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> adminUserService.updateUserRole(adminId, new UpdateUserRoleRequest(RoleName.DOCTOR)))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);
  }
}
