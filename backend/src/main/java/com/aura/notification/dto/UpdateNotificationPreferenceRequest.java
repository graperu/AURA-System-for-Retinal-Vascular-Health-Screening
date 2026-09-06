package com.aura.notification.dto;

public record UpdateNotificationPreferenceRequest(
    Boolean webPush,
    Boolean emailEnabled,
    Boolean smsEnabled,
    Boolean aiReady,
    Boolean doctorMessage,
    Boolean appointmentReminder,
    Boolean lowCredit) {}
