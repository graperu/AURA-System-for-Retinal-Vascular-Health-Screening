package com.aura.admin.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserSummaryDto(
    UUID id,
    String email,
    String fullName,
    boolean active,
    boolean emailVerified,
    Set<String> roles,
    Instant createdAt) {}
