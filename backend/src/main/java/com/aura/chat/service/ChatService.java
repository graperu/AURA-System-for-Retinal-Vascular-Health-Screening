package com.aura.chat.service;

import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.entity.ChatMessage;
import com.aura.chat.repository.ChatMessageRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

  private final ChatMessageRepository chatMessageRepository;
  private final SimpMessagingTemplate messagingTemplate;

  public ChatService(
      ChatMessageRepository chatMessageRepository,
      SimpMessagingTemplate messagingTemplate) {
    this.chatMessageRepository = chatMessageRepository;
    this.messagingTemplate = messagingTemplate;
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
      // Log nhưng không làm fail transaction lưu tin nhắn
    }

    return response;
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
