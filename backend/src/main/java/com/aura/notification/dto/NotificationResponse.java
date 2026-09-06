package com.aura.notification.dto;

import com.aura.notification.entity.AppNotification;
import com.aura.notification.entity.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    NotificationType type,
    String title,
    String body,
    String channels,
    boolean read,
    boolean critical,
    String relatedResourceId,
    Instant createdAt) {

  public static NotificationResponse from(AppNotification n) {
    return new NotificationResponse(
        n.getId(),
        n.getType(),
        n.getTitle(),
        n.getBody(),
        n.getChannels(),
        n.isRead(),
        n.isCritical(),
        n.getRelatedResourceId(),
        n.getCreatedAt());
  }
}
