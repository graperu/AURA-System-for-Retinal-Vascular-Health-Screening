package com.aura.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record CommunicationPolicyDto(
    UUID id,
    String policyKey,
    boolean emailEnabled,
    boolean inAppEnabled,
    boolean smsEnabled,
    boolean highRiskImmediate,
    boolean marketingOptInDefault,
    String quietHoursStart,
    String quietHoursEnd,
    int retentionDays,
    String notes,
    Instant updatedAt) {}
