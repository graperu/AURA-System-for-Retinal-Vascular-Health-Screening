package com.aura.chat.service;

import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.entity.ChatMessage;
import com.aura.chat.repository.ChatMessageRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

  private static final Logger log = LoggerFactory.getLogger(ChatService.class);

  private final ChatMessageRepository chatMessageRepository;
  private final SimpMessagingTemplate messagingTemplate;
  private final UserRepository userRepository;
  private final UserNotificationService userNotificationService;

  public ChatService(
      ChatMessageRepository chatMessageRepository,
      SimpMessagingTemplate messagingTemplate) {
    this(chatMessageRepository, messagingTemplate, null, null);
  }

  @Autowired
  public ChatService(
      ChatMessageRepository chatMessageRepository,
      SimpMessagingTemplate messagingTemplate,
      @Autowired(required = false) UserRepository userRepository,
      @Autowired(required = false) UserNotificationService userNotificationService) {
    this.chatMessageRepository = chatMessageRepository;
    this.messagingTemplate = messagingTemplate;
    this.userRepository = userRepository;
    this.userNotificationService = userNotificationService;
  }

  @Transactional
  public ChatMessageResponse sendMessage(UUID senderId, SendMessageRequest request) {
    ChatMessage msg =
        new ChatMessage(
            senderId,
            request.receiverId(),
            request.screeningId(),
            request.messageText(),
            request.attachmentUrl());
    ChatMessage saved = chatMessageRepository.save(msg);
    ChatMessageResponse response = ChatMessageResponse.fromEntity(saved);

    // Gửi realtime qua WebSocket STOMP tới cả người gửi và người nhận
    try {
      messagingTemplate.convertAndSend("/topic/chat." + request.receiverId(), response);
      messagingTemplate.convertAndSend("/topic/chat." + senderId, response);
      if (request.screeningId() != null) {
        messagingTemplate.convertAndSend("/topic/screening-chat." + request.screeningId(), response);
      }
    } catch (Exception e) {
      log.warn("[ChatService] Failed to push STOMP message: {}", e.getMessage());
    }

    // Gửi thông báo hệ thống (In-App Notification) đến người nhận
    if (userNotificationService != null && request.receiverId() != null) {
      try {
        String senderName = "Người dùng";
        if (userRepository != null) {
          senderName = userRepository.findById(senderId)
              .map(u -> (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getEmail())
              .orElse("Người dùng");
        }

        String rawContent = request.messageText();
        String preview;
        if (rawContent != null && !rawContent.isBlank()) {
          preview = rawContent.length() > 80 ? rawContent.substring(0, 77) + "..." : rawContent;
        } else if (request.attachmentUrl() != null && !request.attachmentUrl().isBlank()) {
          preview = "Đã gửi một tệp đính kèm";
        } else {
          preview = "Bạn có một tin nhắn tư vấn mới";
        }

        userNotificationService.sendNotificationToUser(
            request.receiverId(),
            "Tin nhắn mới từ " + senderName,
            preview,
            "CONSULTATION",
            "INFO",
            "/consultation"
        );
      } catch (Exception e) {
        log.warn("[ChatService] Failed to send chat notification: {}", e.getMessage());
      }
    }

    return response;
  }

  @Transactional(readOnly = true)
  public long getUnreadCount(UUID userId) {
    return chatMessageRepository.countByReceiverIdAndIsReadFalse(userId);
  }

  @Transactional(readOnly = true)
  public List<ChatMessageResponse> getConversation(UUID user1, UUID user2) {
    return chatMessageRepository.findConversationBetween(user1, user2).stream()
        .map(ChatMessageResponse::fromEntity)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ChatMessageResponse> getScreeningMessages(UUID screeningId) {
    return chatMessageRepository.findByScreeningIdOrderByCreatedAtAsc(screeningId).stream()
        .map(ChatMessageResponse::fromEntity)
        .toList();
  }

  @Transactional
  public void markMessagesAsRead(UUID receiverId, UUID senderId) {
    List<ChatMessage> unread =
        chatMessageRepository.findByReceiverIdAndIsReadFalse(receiverId).stream()
            .filter(m -> m.getSenderId().equals(senderId))
            .toList();
    unread.forEach(ChatMessage::markAsRead);
    chatMessageRepository.saveAll(unread);
  }
}
