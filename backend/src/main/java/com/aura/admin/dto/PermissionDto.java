package com.aura.admin.dto;

import java.util.UUID;

public record PermissionDto(
    UUID id, String code, String label, boolean enabled) {}
