package com.aura.chat.service;

import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.entity.ChatMessage;
import com.aura.chat.repository.ChatMessageRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

  private final ChatMessageRepository chatMessageRepository;

  public ChatService(ChatMessageRepository chatMessageRepository) {
    this.chatMessageRepository = chatMessageRepository;
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
    return ChatMessageResponse.fromEntity(saved);
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
