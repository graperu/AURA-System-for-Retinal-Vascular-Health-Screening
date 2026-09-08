package com.aura.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertNotificationTemplateRequest(
    @NotBlank @Size(max = 80) String code,
    @NotBlank @Size(max = 150) String name,
    @NotBlank @Size(max = 32) String channel,
    @NotBlank @Size(max = 255) String subject,
    @NotBlank String body,
    @Size(max = 500) String description,
    Boolean enabled) {}
