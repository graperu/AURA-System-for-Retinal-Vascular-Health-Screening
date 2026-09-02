package com.aura.chat.service;

import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.ConversationSummaryResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.entity.ChatMessage;
import com.aura.chat.repository.ChatMessageRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {

  private static final UUID DEFAULT_DOCTOR_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final UUID DEFAULT_PATIENT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

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
  public List<ChatMessageResponse> getScreeningMessages(UUID screeningId) {
    return chatMessageRepository.findByScreeningIdOrderByCreatedAtAsc(screeningId).stream()
        .map(ChatMessageResponse::fromEntity)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ConversationSummaryResponse> getRecentConversations(UUID currentUserId) {
    List<ChatMessage> allMessages = chatMessageRepository.findUserMessages(currentUserId);
    Map<UUID, List<ChatMessage>> grouped = new LinkedHashMap<>();

    for (ChatMessage msg : allMessages) {
      UUID otherId = msg.getSenderId().equals(currentUserId) ? msg.getReceiverId() : msg.getSenderId();
      grouped.computeIfAbsent(otherId, k -> new ArrayList<>()).add(msg);
    }

    List<ConversationSummaryResponse> summaries = new ArrayList<>();

    for (Map.Entry<UUID, List<ChatMessage>> entry : grouped.entrySet()) {
      UUID otherId = entry.getKey();
      List<ChatMessage> msgs = entry.getValue();
      ChatMessage latest = msgs.get(0);
      long unreadCount = msgs.stream()
          .filter(m -> m.getReceiverId().equals(currentUserId) && Boolean.FALSE.equals(m.getIsRead()))
          .count();

      Optional<User> otherUserOpt = userRepository.findById(otherId);
      String otherName = otherUserOpt.map(User::getFullName).filter(n -> !n.isBlank())
          .orElseGet(() -> otherId.equals(DEFAULT_DOCTOR_ID) ? "BS. CKII Nguyễn Thị Thanh" : "Bệnh nhân " + otherId.toString().substring(0, 8));
      String otherEmail = otherUserOpt.map(User::getEmail).orElse("user@aura.com");
      String role = otherId.equals(DEFAULT_DOCTOR_ID) ? "DOCTOR" : "PATIENT";

      summaries.add(new ConversationSummaryResponse(
          otherId,
          otherName,
          otherEmail,
          role,
          latest.getMessageText(),
          latest.getCreatedAt(),
          unreadCount,
          latest.getScreeningId()
      ));
    }

    // Ensure default contact is present if not yet contacted
    if (summaries.stream().noneMatch(c -> c.otherUserId().equals(DEFAULT_DOCTOR_ID))
        && !currentUserId.equals(DEFAULT_DOCTOR_ID)) {
      Optional<User> docOpt = userRepository.findById(DEFAULT_DOCTOR_ID);
      String docName = docOpt.map(User::getFullName).orElse("BS. CKII Nguyễn Thị Thanh");
      String docEmail = docOpt.map(User::getEmail).orElse("doctor@aura.com");
      summaries.add(new ConversationSummaryResponse(
          DEFAULT_DOCTOR_ID,
          docName,
          docEmail,
          "DOCTOR",
          "Chào bạn! Tôi là Bác sĩ chuyên khoa phụ trách chẩn đoán.",
          null,
          0,
          null
      ));
    } else if (summaries.stream().noneMatch(c -> c.otherUserId().equals(DEFAULT_PATIENT_ID))
        && currentUserId.equals(DEFAULT_DOCTOR_ID)) {
      Optional<User> patOpt = userRepository.findById(DEFAULT_PATIENT_ID);
      String patName = patOpt.map(User::getFullName).orElse("Bệnh nhân Nguyễn Trọng Nam");
      String patEmail = patOpt.map(User::getEmail).orElse("patient@aura.com");
      summaries.add(new ConversationSummaryResponse(
          DEFAULT_PATIENT_ID,
          patName,
          patEmail,
          "PATIENT",
          "Kính chào Bác sĩ! Tôi cần tư vấn kết quả khám võng mạc.",
          null,
          0,
          null
      ));
    }

    return summaries;
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
