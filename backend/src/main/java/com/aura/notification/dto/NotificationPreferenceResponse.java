package com.aura.notification.dto;

public record NotificationPreferenceResponse(
    boolean webPush,
    boolean emailEnabled,
    boolean smsEnabled,
    boolean aiReady,
    boolean doctorMessage,
    boolean appointmentReminder,
    boolean lowCredit) {}
