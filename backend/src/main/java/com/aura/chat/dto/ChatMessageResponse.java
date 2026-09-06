package com.aura.chat.dto;

import com.aura.chat.entity.ChatMessage;
import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(
    UUID id,
    UUID senderId,
    UUID receiverId,
    UUID screeningId,
    String messageText,
    String attachmentUrl,
    Boolean isRead,
    Instant readAt,
    Instant createdAt) {

  public static ChatMessageResponse fromEntity(ChatMessage msg) {
    return new ChatMessageResponse(
        msg.getId(),
        msg.getSenderId(),
        msg.getReceiverId(),
        msg.getScreeningId(),
        msg.getMessageText(),
        msg.getAttachmentUrl(),
        msg.getIsRead(),
        msg.getReadAt(),
        msg.getCreatedAt());
  }
}
