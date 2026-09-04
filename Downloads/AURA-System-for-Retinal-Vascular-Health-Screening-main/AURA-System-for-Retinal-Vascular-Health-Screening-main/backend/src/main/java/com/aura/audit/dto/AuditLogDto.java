package com.aura.audit.dto;

import com.aura.audit.entity.AuditLog;
import java.time.Instant;
import java.util.UUID;

public record AuditLogDto(
    UUID id,
    UUID userId,
    String userEmail,
    String action,
    String resourceType,
    String resourceId,
    String ipAddress,
    String status,
    String details,
    Instant createdAt) {

  public static AuditLogDto fromEntity(AuditLog log) {
    return new AuditLogDto(
        log.getId(),
        log.getUserId(),
        log.getUserEmail(),
        log.getAction(),
        log.getResourceType(),
        log.getResourceId(),
        log.getIpAddress(),
        log.getStatus(),
        log.getDetails(),
        log.getCreatedAt());
  }
}
