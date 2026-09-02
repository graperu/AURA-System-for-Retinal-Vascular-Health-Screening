package com.aura.chat.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummaryResponse(
    UUID otherUserId,
    String otherUserName,
    String otherUserEmail,
    String otherUserRole,
    String lastMessageText,
    Instant lastMessageTime,
    long unreadCount,
    UUID screeningId) {}
