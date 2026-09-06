package com.aura.admin.service;

import com.aura.admin.dto.AiConfigDto;
import com.aura.admin.dto.UpdateUserStatusRequest;
import com.aura.admin.dto.UserSummaryDto;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.role.entity.Role;
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

    // No synthetic model metadata: values appear only after an administrator
    // configures a deployed and validated model.
  }

  @Transactional(readOnly = true)
  public Page<UserSummaryDto> getAllUsers(Pageable pageable) {
    Page<User> usersPage = userRepository.findAll(pageable);
    List<UUID> userIds = usersPage.getContent().stream().map(User::getId).toList();

    List<UserRole> userRoles = userRoleRepository.findAllByUserIdIn(userIds);

    Map<UUID, Set<String>> userRolesMap =
        userRoles.stream()
            .collect(
                Collectors.groupingBy(
                    ur -> ur.getUser().getId(),
                    Collectors.mapping(
                        ur -> ur.getRole().getName().name(),
                        Collectors.toSet())));

    List<UserSummaryDto> dtos =
        usersPage.getContent().stream()
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

    return new PageImpl<>(dtos, pageable, usersPage.getTotalElements());
  }

  @Transactional
  public UserSummaryDto updateUserStatus(UUID userId, UpdateUserStatusRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    user.setActive(request.active());
    User saved = userRepository.save(user);

    List<UserRole> roles = userRoleRepository.findAllByUserId(saved.getId());
    Set<String> roleNames =
        roles.stream()
            .map(r -> r.getRole().getName().name())
            .collect(Collectors.toSet());

    return new UserSummaryDto(
        saved.getId(),
        saved.getEmail(),
        saved.getFullName(),
        saved.isActive(),
        saved.isEmailVerified(),
        roleNames,
        saved.getCreatedAt());
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
}
