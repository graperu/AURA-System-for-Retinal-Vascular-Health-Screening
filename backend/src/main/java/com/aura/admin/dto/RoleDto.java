package com.aura.admin.dto;

import com.aura.role.enums.RoleName;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RoleDto(
    UUID id,
    RoleName name,
    String description,
    Instant updatedAt,
    List<PermissionDto> permissions) {}
