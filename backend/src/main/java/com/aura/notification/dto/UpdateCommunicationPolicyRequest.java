package com.aura.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateCommunicationPolicyRequest(
    Boolean emailEnabled,
    Boolean inAppEnabled,
    Boolean smsEnabled,
    Boolean highRiskImmediate,
    Boolean marketingOptInDefault,
    @Size(max = 5) String quietHoursStart,
    @Size(max = 5) String quietHoursEnd,
    @Min(30) @Max(2555) Integer retentionDays,
    String notes) {}
