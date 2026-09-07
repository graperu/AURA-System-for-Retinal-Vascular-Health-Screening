package com.aura.chat.service;

import com.aura.auth.repository.UserRepository;
import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.ConversationSummaryResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.entity.ChatMessage;
import com.aura.chat.repository.ChatMessageRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

  private final ChatMessageRepository chatMessageRepository;
  private final UserRepository userRepository;

  public ChatService(ChatMessageRepository chatMessageRepository, UserRepository userRepository) {
    this.chatMessageRepository = chatMessageRepository;
    this.userRepository = userRepository;
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
  public List<ConversationSummaryResponse> getRecentConversations(UUID currentUserId) {
    List<ChatMessage> userMessages = chatMessageRepository.findUserMessages(currentUserId);
    Map<UUID, List<ChatMessage>> grouped = new LinkedHashMap<>();

    for (ChatMessage msg : userMessages) {
      UUID otherId = msg.getSenderId().equals(currentUserId) ? msg.getReceiverId() : msg.getSenderId();
      grouped.computeIfAbsent(otherId, k -> new ArrayList<>()).add(msg);
    }

    List<ConversationSummaryResponse> summaries = new ArrayList<>();
    for (Map.Entry<UUID, List<ChatMessage>> entry : grouped.entrySet()) {
      UUID otherId = entry.getKey();
      List<ChatMessage> thread = entry.getValue();
      ChatMessage latest = thread.get(0);

      long unreadCount =
          thread.stream()
              .filter(m -> m.getReceiverId().equals(currentUserId) && !Boolean.TRUE.equals(m.getIsRead()))
              .count();

      String userName = "Người dùng (" + otherId.toString().substring(0, 8) + ")";
      String userEmail = "aura.user@aura.com";
      String userRole = "USER";

      var userOpt = userRepository.findById(otherId);
      if (userOpt.isPresent()) {
        var user = userOpt.get();
        userName = user.getFullName() != null ? user.getFullName() : user.getEmail();
        userEmail = user.getEmail();
        userRole = user.getRole() != null ? user.getRole().name() : "USER";
      } else {
        if (otherId.equals(UUID.fromString("22222222-2222-2222-2222-222222222222"))) {
          userName = "BS. CKII Nguyễn Thị Thanh";
          userEmail = "doctor@aura.com";
          userRole = "DOCTOR";
        } else if (otherId.equals(UUID.fromString("11111111-1111-1111-1111-111111111111"))) {
          userName = "Bệnh nhân Nguyễn Trọng Nam";
          userEmail = "patient@aura.com";
          userRole = "PATIENT";
        }
      }

      summaries.add(
          new ConversationSummaryResponse(
              otherId,
              userName,
              userEmail,
              userRole,
              latest.getMessageText(),
              latest.getCreatedAt(),
              unreadCount,
              latest.getScreeningId()));
    }

    return summaries;
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
