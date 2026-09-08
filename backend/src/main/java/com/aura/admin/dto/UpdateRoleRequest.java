package com.aura.admin.dto;

import jakarta.validation.constraints.Size;

public record UpdateRoleRequest(@Size(max = 255) String description) {}
