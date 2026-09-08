package com.aura.admin.service;

import com.aura.admin.dto.PermissionDto;
import com.aura.admin.dto.RoleDto;
import com.aura.admin.dto.UpdateRolePermissionsRequest;
import com.aura.admin.dto.UpdateRoleRequest;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.role.entity.Role;
import com.aura.role.entity.RolePermission;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RolePermissionRepository;
import com.aura.role.repository.RoleRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminRoleService {

  private final RoleRepository roleRepository;
  private final RolePermissionRepository permissionRepository;

  public AdminRoleService(RoleRepository roleRepository, RolePermissionRepository permissionRepository) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
  }

  @Transactional(readOnly = true)
  public List<RoleDto> listRoles() {
    Map<RoleName, List<RolePermission>> byRole =
        permissionRepository.findAllByOrderByRoleNameAscPermissionCodeAsc().stream()
            .collect(Collectors.groupingBy(RolePermission::getRoleName));
    return roleRepository.findAll().stream()
        .sorted(Comparator.comparing(r -> r.getName().name()))
        .map(role -> toDto(role, byRole.getOrDefault(role.getName(), List.of())))
        .toList();
  }

  @Transactional
  public RoleDto updateRole(RoleName roleName, UpdateRoleRequest request) {
    Role role =
        roleRepository
            .findByName(roleName)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + roleName));
    if (request.description() != null) {
      role.setDescription(request.description().trim());
    }
    roleRepository.save(role);
    return toDto(role, permissionRepository.findByRoleNameOrderByPermissionCodeAsc(roleName));
  }

  @Transactional
  public RoleDto updatePermissions(RoleName roleName, UpdateRolePermissionsRequest request) {
    Role role =
        roleRepository
            .findByName(roleName)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò " + roleName));
    Map<UUID, RolePermission> existing =
        permissionRepository.findByRoleNameOrderByPermissionCodeAsc(roleName).stream()
            .collect(Collectors.toMap(RolePermission::getId, p -> p));
    List<RolePermission> updated = new ArrayList<>();
    for (var toggle : request.permissions()) {
      RolePermission permission = null;
      if (toggle.id() != null) {
        permission = existing.get(toggle.id());
      }
      if (permission == null && toggle.code() != null) {
        permission =
            existing.values().stream()
                .filter(p -> p.getPermissionCode().equalsIgnoreCase(toggle.code()))
                .findFirst()
                .orElse(null);
      }
      if (permission == null) {
        throw new ResourceNotFoundException("Không tìm thấy quyền trong vai trò " + roleName);
      }
      permission.setEnabled(Boolean.TRUE.equals(toggle.enabled()));
      updated.add(permission);
    }
    permissionRepository.saveAll(updated);
    return toDto(role, permissionRepository.findByRoleNameOrderByPermissionCodeAsc(roleName));
  }

  private RoleDto toDto(Role role, List<RolePermission> permissions) {
    return new RoleDto(
        role.getId(),
        role.getName(),
        role.getDescription(),
        role.getUpdatedAt(),
        permissions.stream()
            .map(
                p ->
                    new PermissionDto(
                        p.getId(), p.getPermissionCode(), p.getPermissionLabel(), p.isEnabled()))
            .toList());
  }
}
