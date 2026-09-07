package com.aura.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationTemplateDto(
    UUID id,
    String code,
    String name,
    String channel,
    String subject,
    String body,
    String description,
    boolean enabled,
    Instant updatedAt) {}
