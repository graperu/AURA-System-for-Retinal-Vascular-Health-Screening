package com.aura.admin.service;

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
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

  private final UserRepository userRepository;
  private final UserRoleRepository userRoleRepository;
  private final RoleRepository roleRepository;
  private final Map<String, Object> aiConfigStore = new ConcurrentHashMap<>();

  public AdminUserService(
      UserRepository userRepository,
      UserRoleRepository userRoleRepository,
      RoleRepository roleRepository) {
    this.userRepository = userRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
  }

  @Transactional(readOnly = true)
  public Page<UserSummaryDto> getAllUsers(String query, RoleName role, Pageable pageable) {
    String q = query == null ? null : query.trim();
    Page<User> usersPage = userRepository.search(q, role, pageable);
    return new PageImpl<>(toDtos(usersPage.getContent()), pageable, usersPage.getTotalElements());
  }

  @Transactional
  public UserSummaryDto updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
    User user = requireUser(userId);
    if (Boolean.FALSE.equals(request.active()) && isSoleActiveAdmin(user)) {
      throw new IllegalArgumentException("Không thể vô hiệu hóa quản trị viên đang hoạt động cuối cùng");
    }
    user.setActive(request.active());
    return toDto(userRepository.save(user));
  }

  @Transactional
  public UserSummaryDto updateUser(UUID userId, UpdateUserRequest request) {
    User user = requireUser(userId);
    if (request.fullName() != null) {
      String name = request.fullName().trim();
      if (name.isEmpty()) {
        throw new IllegalArgumentException("Họ tên không được để trống");
      }
      user.setFullName(name);
    }
    if (request.email() != null) {
      String email = request.email().trim().toLowerCase();
      if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, userId)) {
        throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác");
      }
      user.setEmail(email);
    }
    if (request.emailVerified() != null) {
      user.setEmailVerified(request.emailVerified());
    }
    return toDto(userRepository.save(user));
  }

  @Transactional
  public UserSummaryDto updateUserRole(UUID userId, UpdateUserRoleRequest request) {
    User user = requireUser(userId);
    RoleName nextRole = request.role();
    Set<String> current = roleNamesOf(userId);
    if (current.contains(RoleName.ADMIN.name())
        && nextRole != RoleName.ADMIN
        && isSoleActiveAdmin(user)) {
      throw new IllegalArgumentException("Không thể hạ vai trò quản trị viên đang hoạt động cuối cùng");
    }
    Role role =
        roleRepository
            .findByName(nextRole)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + nextRole));
    userRoleRepository.deleteAllByUserId(userId);
    userRoleRepository.flush();
    userRoleRepository.save(new UserRole(user, role));
    return toDto(user);
  }

  public AiConfigDto getAiConfig() {
    return new AiConfigDto(
        (String) aiConfigStore.get("activeModelVersion"),
        (Double) aiConfigStore.get("sensitivityThreshold"),
        (Double) aiConfigStore.get("confidenceThreshold"),
        (Double) aiConfigStore.get("avrWarningThreshold"),
        (Boolean) aiConfigStore.get("autoRetrainEnabled"),
        (String) aiConfigStore.get("lastUpdated"));
  }

  public AiConfigDto updateAiConfig(AiConfigDto update) {
    if (update.activeModelVersion() != null) {
      aiConfigStore.put("activeModelVersion", update.activeModelVersion());
    }
    if (update.sensitivityThreshold() != null) {
      aiConfigStore.put("sensitivityThreshold", update.sensitivityThreshold());
    }
    if (update.confidenceThreshold() != null) {
      aiConfigStore.put("confidenceThreshold", update.confidenceThreshold());
    }
    if (update.avrWarningThreshold() != null) {
      aiConfigStore.put("avrWarningThreshold", update.avrWarningThreshold());
    }
    if (update.autoRetrainEnabled() != null) {
      aiConfigStore.put("autoRetrainEnabled", update.autoRetrainEnabled());
    }
    aiConfigStore.put("lastUpdated", Instant.now().toString());
    return getAiConfig();
  }

  private User requireUser(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
  }

  private boolean isSoleActiveAdmin(User user) {
    if (!user.isActive()) {
      return false;
    }
    boolean isAdmin = userRoleRepository.existsByUserIdAndRole(user.getId(), RoleName.ADMIN);
    if (!isAdmin) {
      return false;
    }
    return userRoleRepository.countByRole_NameAndUser_ActiveTrue(RoleName.ADMIN) <= 1;
  }

  private List<UserSummaryDto> toDtos(List<User> users) {
    List<UUID> userIds = users.stream().map(User::getId).toList();
    Map<UUID, Set<String>> userRolesMap =
        userIds.isEmpty()
            ? Map.of()
            : userRoleRepository.findAllByUserIdIn(userIds).stream()
                .collect(
                    Collectors.groupingBy(
                        ur -> ur.getUser().getId(),
                        Collectors.mapping(ur -> ur.getRole().getName().name(), Collectors.toSet())));
    return users.stream()
        .map(
            u ->
                new UserSummaryDto(
                    u.getId(),
                    u.getEmail(),
                    u.getFullName(),
                    u.isActive(),
                    u.isEmailVerified(),
                    userRolesMap.getOrDefault(u.getId(), Collections.emptySet()),
                    u.getCreatedAt()))
        .toList();
  }

  private UserSummaryDto toDto(User user) {
    return toDtos(List.of(user)).get(0);
  }

  private Set<String> roleNamesOf(UUID userId) {
    return userRoleRepository.findAllByUserId(userId).stream()
        .map(r -> r.getRole().getName().name())
        .collect(Collectors.toSet());
  }
}
