package com.aura.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.AiConfigDto;
import com.aura.admin.dto.UpdateUserRequest;
import com.aura.admin.dto.UpdateUserRoleRequest;
import com.aura.admin.dto.UpdateUserStatusRequest;
import com.aura.admin.dto.UserSummaryDto;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.Collections;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;
  @Mock private RoleRepository roleRepository;

  @InjectMocks private AdminUserService adminUserService;

  private UUID testUserId;
  private User testUser;
  private Role adminRole;
  private Role userRole;
  private Role doctorRole;

  @BeforeEach
  void setUp() {
    testUserId = UUID.randomUUID();
    testUser = new User("admin@aura.com", "hash", "Quản trị viên");
    ReflectionTestUtils.setField(testUser, "id", testUserId);
    testUser.setActive(true);
    testUser.setEmailVerified(true);

    adminRole = new Role();
    ReflectionTestUtils.setField(adminRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(adminRole, "name", RoleName.ADMIN);

    userRole = new Role();
    ReflectionTestUtils.setField(userRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(userRole, "name", RoleName.USER);

    doctorRole = new Role();
    ReflectionTestUtils.setField(doctorRole, "id", UUID.randomUUID());
    ReflectionTestUtils.setField(doctorRole, "name", RoleName.DOCTOR);
  }

  @Nested
  @DisplayName("getAllUsers tests")
  class GetAllUsersTests {

    @Test
    @DisplayName("getAllUsers returns paged UserSummaryDto with mapped roles")
    void getAllUsers_WithResults_ReturnsPagedDtos() {
      // Arrange
      Pageable pageable = PageRequest.of(0, 10);
      when(userRepository.search("admin", RoleName.ADMIN, pageable))
          .thenReturn(new PageImpl<>(List.of(testUser), pageable, 1));
      when(userRoleRepository.findAllByUserIdIn(List.of(testUserId)))
          .thenReturn(List.of(new UserRole(testUser, adminRole)));

      // Act
      Page<UserSummaryDto> result = adminUserService.getAllUsers("  admin  ", RoleName.ADMIN, pageable);

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.getTotalElements()).isEqualTo(1);
      UserSummaryDto dto = result.getContent().get(0);
      assertThat(dto.id()).isEqualTo(testUserId);
      assertThat(dto.email()).isEqualTo("admin@aura.com");
      assertThat(dto.roles()).containsExactly("ADMIN");
    }

    @Test
    @DisplayName("getAllUsers returns empty page when no users match search")
    void getAllUsers_NoResults_ReturnsEmptyPage() {
      // Arrange
      Pageable pageable = PageRequest.of(0, 10);
      when(userRepository.search(null, null, pageable))
          .thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));

      // Act
      Page<UserSummaryDto> result = adminUserService.getAllUsers(null, null, pageable);

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.isEmpty()).isTrue();
      verify(userRoleRepository, never()).findAllByUserIdIn(any());
    }
  }

  @Nested
  @DisplayName("updateUserStatus tests")
  class UpdateUserStatusTests {

    @Test
    @DisplayName("updateUserStatus to active succeeds")
    void updateUserStatus_Activate_Success() {
      // Arrange
      testUser.setActive(false);
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRepository.save(testUser)).thenReturn(testUser);
      when(userRoleRepository.findAllByUserIdIn(List.of(testUserId)))
          .thenReturn(List.of(new UserRole(testUser, userRole)));

      // Act
      UserSummaryDto result = adminUserService.updateUserStatus(testUserId, new UpdateUserStatusRequest(true));

      // Assert
      assertThat(result.active()).isTrue();
      assertThat(testUser.isActive()).isTrue();
      verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("updateUserStatus deactivate normal user succeeds")
    void updateUserStatus_DeactivateNormalUser_Success() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRoleRepository.existsByUserIdAndRole(testUserId, RoleName.ADMIN)).thenReturn(false);
      when(userRepository.save(testUser)).thenReturn(testUser);
      when(userRoleRepository.findAllByUserIdIn(List.of(testUserId)))
          .thenReturn(List.of(new UserRole(testUser, userRole)));

      // Act
      UserSummaryDto result = adminUserService.updateUserStatus(testUserId, new UpdateUserStatusRequest(false));

      // Assert
      assertThat(result.active()).isFalse();
      verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("updateUserStatus deactivate sole active admin throws IllegalArgumentException")
    void updateUserStatus_DeactivateSoleAdmin_ThrowsException() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRoleRepository.existsByUserIdAndRole(testUserId, RoleName.ADMIN)).thenReturn(true);
      when(userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(1L);

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUserStatus(testUserId, new UpdateUserStatusRequest(false)))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Không thể vô hiệu hóa quản trị viên đang hoạt động cuối cùng");
          });
      verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUserStatus with unknown userId throws ResourceNotFoundException")
    void updateUserStatus_UserNotFound_ThrowsException() {
      // Arrange
      UUID missingId = UUID.randomUUID();
      when(userRepository.findById(missingId)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUserStatus(missingId, new UpdateUserStatusRequest(true)))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("updateUser tests")
  class UpdateUserTests {

    @Test
    @DisplayName("updateUser updates fullName, email and emailVerified")
    void updateUser_ValidFields_Success() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRepository.existsByEmailIgnoreCaseAndIdNot("new.email@aura.com", testUserId)).thenReturn(false);
      when(userRepository.save(testUser)).thenReturn(testUser);
      when(userRoleRepository.findAllByUserIdIn(List.of(testUserId)))
          .thenReturn(List.of(new UserRole(testUser, adminRole)));

      // Act
      UserSummaryDto result = adminUserService.updateUser(
          testUserId,
          new UpdateUserRequest("  Bác sĩ Nguyễn  ", "  New.Email@aura.com  ", true)
      );

      // Assert
      assertThat(result).isNotNull();
      assertThat(testUser.getFullName()).isEqualTo("Bác sĩ Nguyễn");
      assertThat(testUser.getEmail()).isEqualTo("new.email@aura.com");
      assertThat(testUser.isEmailVerified()).isTrue();
      verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("updateUser with blank fullName throws IllegalArgumentException")
    void updateUser_BlankName_ThrowsException() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUser(testUserId, new UpdateUserRequest("   ", null, null)))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Họ tên không được để trống");
          });
    }

    @Test
    @DisplayName("updateUser with duplicate email throws IllegalArgumentException")
    void updateUser_DuplicateEmail_ThrowsException() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRepository.existsByEmailIgnoreCaseAndIdNot("duplicate@aura.com", testUserId)).thenReturn(true);

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUser(testUserId, new UpdateUserRequest(null, "duplicate@aura.com", null)))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Email đã được sử dụng bởi tài khoản khác");
          });
      verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUser with unknown userId throws ResourceNotFoundException")
    void updateUser_UserNotFound_ThrowsException() {
      // Arrange
      UUID missingId = UUID.randomUUID();
      when(userRepository.findById(missingId)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUser(missingId, new UpdateUserRequest("Tên", null, null)))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("updateUserRole tests")
  class UpdateUserRoleTests {

    @Test
    @DisplayName("updateUserRole changes role successfully")
    void updateUserRole_Success() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRoleRepository.findAllByUserId(testUserId))
          .thenReturn(List.of(new UserRole(testUser, userRole)));
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.of(doctorRole));
      when(userRoleRepository.findAllByUserIdIn(List.of(testUserId)))
          .thenReturn(List.of(new UserRole(testUser, doctorRole)));

      // Act
      UserSummaryDto result = adminUserService.updateUserRole(testUserId, new UpdateUserRoleRequest(RoleName.DOCTOR));

      // Assert
      assertThat(result).isNotNull();
      verify(userRoleRepository).deleteAllByUserId(testUserId);
      verify(userRoleRepository).flush();
      verify(userRoleRepository).save(any(UserRole.class));
    }

    @Test
    @DisplayName("updateUserRole demoting sole active admin throws IllegalArgumentException")
    void updateUserRole_DemoteSoleAdmin_ThrowsException() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRoleRepository.findAllByUserId(testUserId))
          .thenReturn(List.of(new UserRole(testUser, adminRole)));
      when(userRoleRepository.existsByUserIdAndRole(testUserId, RoleName.ADMIN)).thenReturn(true);
      when(userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN)).thenReturn(1L);

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUserRole(testUserId, new UpdateUserRoleRequest(RoleName.USER)))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Không thể hạ vai trò quản trị viên đang hoạt động cuối cùng");
          });
      verify(userRoleRepository, never()).deleteAllByUserId(any());
    }

    @Test
    @DisplayName("updateUserRole throws ResourceNotFoundException if role does not exist in DB")
    void updateUserRole_RoleNotFound_ThrowsException() {
      // Arrange
      when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
      when(userRoleRepository.findAllByUserId(testUserId)).thenReturn(List.of());
      when(roleRepository.findByName(RoleName.DOCTOR)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUserRole(testUserId, new UpdateUserRoleRequest(RoleName.DOCTOR)))
          .isInstanceOfSatisfying(ResourceNotFoundException.class, e -> {
            assertThat(e.getMessage()).contains("Không tìm thấy vai trò DOCTOR");
          });
    }

    @Test
    @DisplayName("updateUserRole with unknown userId throws ResourceNotFoundException")
    void updateUserRole_UserNotFound_ThrowsException() {
      // Arrange
      UUID missingId = UUID.randomUUID();
      when(userRepository.findById(missingId)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> adminUserService.updateUserRole(missingId, new UpdateUserRoleRequest(RoleName.USER)))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("AI Config tests")
  class AiConfigTests {

    @Test
    @DisplayName("getAiConfig and updateAiConfig manage AI threshold settings")
    void aiConfig_GetAndUpdate_Succeeds() {
      // Act 1: Initial empty config
      AiConfigDto initial = adminUserService.getAiConfig();
      assertThat(initial.activeModelVersion()).isNull();

      // Act 2: Update config
      AiConfigDto update = new AiConfigDto(
          "gemini-3.7-flash-retinal-v2",
          0.85,
          0.90,
          0.65,
          true,
          null
      );
      AiConfigDto updated = adminUserService.updateAiConfig(update);

      // Assert
      assertThat(updated.activeModelVersion()).isEqualTo("gemini-3.7-flash-retinal-v2");
      assertThat(updated.sensitivityThreshold()).isEqualTo(0.85);
      assertThat(updated.confidenceThreshold()).isEqualTo(0.90);
      assertThat(updated.avrWarningThreshold()).isEqualTo(0.65);
      assertThat(updated.autoRetrainEnabled()).isTrue();
      assertThat(updated.lastUpdated()).isNotNull();

      // Act 3: Read back config
      AiConfigDto readBack = adminUserService.getAiConfig();
      assertThat(readBack.activeModelVersion()).isEqualTo("gemini-3.7-flash-retinal-v2");
      assertThat(readBack.avrWarningThreshold()).isEqualTo(0.65);
    }
  }
}
