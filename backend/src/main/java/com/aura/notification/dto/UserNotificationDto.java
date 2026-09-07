package com.aura.notification.dto;

import com.aura.notification.entity.UserNotification;
import java.time.Instant;
import java.util.UUID;

public record UserNotificationDto(
    UUID id,
    UUID userId,
    String title,
    String message,
    String type,
    String severity,
    String linkUrl,
    boolean isRead,
    Instant createdAt) {

  public static UserNotificationDto fromEntity(UserNotification entity) {
    return new UserNotificationDto(
        entity.getId(),
        entity.getUserId(),
        entity.getTitle(),
        entity.getMessage(),
        entity.getType(),
        entity.getSeverity(),
        entity.getLinkUrl(),
        entity.isRead(),
        entity.getCreatedAt());
  }
}
