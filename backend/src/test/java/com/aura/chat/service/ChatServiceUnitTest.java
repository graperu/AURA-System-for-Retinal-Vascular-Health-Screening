package com.aura.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.entity.ChatMessage;
import com.aura.chat.repository.ChatMessageRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService Unit Tests (FR-10 Teleconsultation & STOMP Push)")
class ChatServiceUnitTest {

  @Mock private ChatMessageRepository chatMessageRepository;
  @Mock private SimpMessagingTemplate messagingTemplate;
  @Mock private UserRepository userRepository;
  @Mock private UserNotificationService userNotificationService;

  @InjectMocks private ChatService chatService;

  private UUID doctorId;
  private UUID patientId;
  private UUID screeningId;

  @BeforeEach
  void setUp() {
    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    screeningId = UUID.randomUUID();
  }

  @Nested
  @DisplayName("sendMessage Tests")
  class SendMessageTests {

    @Test
    @DisplayName("Successfully saves message and dispatches STOMP to sender and receiver topics")
    void sendMessage_DirectMessage_SavesAndPushesStomp() {
      SendMessageRequest request =
          new SendMessageRequest(patientId, null, "Xin chào bác sĩ, kết quả quét của tôi thế nào?", null);

      UUID messageId = UUID.randomUUID();
      when(chatMessageRepository.save(any(ChatMessage.class)))
          .thenAnswer(inv -> {
            ChatMessage msg = inv.getArgument(0);
            ReflectionTestUtils.setField(msg, "id", messageId);
            ReflectionTestUtils.setField(msg, "createdAt", Instant.now());
            return msg;
          });

      ChatMessageResponse response = chatService.sendMessage(doctorId, request);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(messageId);
      assertThat(response.senderId()).isEqualTo(doctorId);
      assertThat(response.receiverId()).isEqualTo(patientId);
      assertThat(response.screeningId()).isNull();
      assertThat(response.messageText()).isEqualTo("Xin chào bác sĩ, kết quả quét của tôi thế nào?");
      assertThat(response.isRead()).isFalse();

      verify(chatMessageRepository).save(any(ChatMessage.class));
      // STOMP delivered to both parties
      verify(messagingTemplate).convertAndSend(eq("/topic/chat." + patientId), eq(response));
      verify(messagingTemplate).convertAndSend(eq("/topic/chat." + doctorId), eq(response));
      // No screening topic since screeningId is null
      verify(messagingTemplate, never()).convertAndSend(org.mockito.ArgumentMatchers.startsWith("/topic/screening-chat."), any(Object.class));
    }

    @Test
    @DisplayName("Successfully saves message with screening context and dispatches to screening topic")
    void sendMessage_WithScreeningContext_PushesToScreeningTopic() {
      SendMessageRequest request =
          new SendMessageRequest(
              patientId,
              screeningId,
              "Hình ảnh đáy mắt có dấu hiệu xuất huyết vi mạch nhẹ.",
              "https://storage.aura.health/attachments/retina-annotated.png");

      UUID messageId = UUID.randomUUID();
      when(chatMessageRepository.save(any(ChatMessage.class)))
          .thenAnswer(inv -> {
            ChatMessage msg = inv.getArgument(0);
            ReflectionTestUtils.setField(msg, "id", messageId);
            ReflectionTestUtils.setField(msg, "createdAt", Instant.now());
            return msg;
          });

      ChatMessageResponse response = chatService.sendMessage(doctorId, request);

      assertThat(response).isNotNull();
      assertThat(response.screeningId()).isEqualTo(screeningId);
      assertThat(response.attachmentUrl()).isEqualTo("https://storage.aura.health/attachments/retina-annotated.png");

      verify(messagingTemplate).convertAndSend(eq("/topic/chat." + patientId), eq(response));
      verify(messagingTemplate).convertAndSend(eq("/topic/chat." + doctorId), eq(response));
      verify(messagingTemplate).convertAndSend(eq("/topic/screening-chat." + screeningId), eq(response));
    }

    @Test
    @DisplayName("STOMP dispatch failure does not abort transaction; message is still saved and returned")
    void sendMessage_StompException_ResilientFallback() {
      SendMessageRequest request =
          new SendMessageRequest(patientId, null, "Tin nhắn thử nghiệm mạng chập chờn", null);

      UUID messageId = UUID.randomUUID();
      when(chatMessageRepository.save(any(ChatMessage.class)))
          .thenAnswer(inv -> {
            ChatMessage msg = inv.getArgument(0);
            ReflectionTestUtils.setField(msg, "id", messageId);
            ReflectionTestUtils.setField(msg, "createdAt", Instant.now());
            return msg;
          });

      doThrow(new MessagingException("Broker connection timeout"))
          .when(messagingTemplate)
          .convertAndSend(eq("/topic/chat." + patientId), any(ChatMessageResponse.class));

      ChatMessageResponse response = chatService.sendMessage(doctorId, request);

      assertThat(response).isNotNull();
      assertThat(response.id()).isEqualTo(messageId);
      assertThat(response.messageText()).isEqualTo("Tin nhắn thử nghiệm mạng chập chờn");
      verify(chatMessageRepository).save(any(ChatMessage.class));
    }
  }

  @Nested
  @DisplayName("getConversation Tests")
  class GetConversationTests {

    @Test
    @DisplayName("Returns full conversation history between two users mapped to response DTOs")
    void getConversation_ReturnsMessages() {
      ChatMessage m1 = new ChatMessage(patientId, doctorId, null, "Chào bác sĩ", null);
      ReflectionTestUtils.setField(m1, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(m1, "createdAt", Instant.now().minusSeconds(60));

      ChatMessage m2 = new ChatMessage(doctorId, patientId, null, "Chào bạn, tôi có thể giúp gì?", null);
      ReflectionTestUtils.setField(m2, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(m2, "createdAt", Instant.now().minusSeconds(30));

      when(chatMessageRepository.findConversationBetween(doctorId, patientId))
          .thenReturn(List.of(m1, m2));

      List<ChatMessageResponse> results = chatService.getConversation(doctorId, patientId);

      assertThat(results).hasSize(2);
      assertThat(results.get(0).messageText()).isEqualTo("Chào bác sĩ");
      assertThat(results.get(1).messageText()).isEqualTo("Chào bạn, tôi có thể giúp gì?");
      verify(chatMessageRepository).findConversationBetween(doctorId, patientId);
    }

    @Test
    @DisplayName("Returns empty list when no conversation exists between users")
    void getConversation_Empty_ReturnsEmptyList() {
      when(chatMessageRepository.findConversationBetween(doctorId, patientId))
          .thenReturn(List.of());

      List<ChatMessageResponse> results = chatService.getConversation(doctorId, patientId);

      assertThat(results).isEmpty();
    }
  }

  @Nested
  @DisplayName("getScreeningMessages Tests")
  class GetScreeningMessagesTests {

    @Test
    @DisplayName("Returns messages attached to a specific screening consultation")
    void getScreeningMessages_ReturnsOrderedMessages() {
      ChatMessage m1 = new ChatMessage(doctorId, patientId, screeningId, "Phân tích ảnh số 1", null);
      ReflectionTestUtils.setField(m1, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(m1, "createdAt", Instant.now().minusSeconds(120));

      when(chatMessageRepository.findByScreeningIdOrderByCreatedAtAsc(screeningId))
          .thenReturn(List.of(m1));

      List<ChatMessageResponse> results = chatService.getScreeningMessages(screeningId);

      assertThat(results).hasSize(1);
      assertThat(results.get(0).screeningId()).isEqualTo(screeningId);
      assertThat(results.get(0).messageText()).isEqualTo("Phân tích ảnh số 1");
      verify(chatMessageRepository).findByScreeningIdOrderByCreatedAtAsc(screeningId);
    }

    @Test
    @DisplayName("Returns empty list when screening has no consultation messages")
    void getScreeningMessages_Empty_ReturnsEmptyList() {
      when(chatMessageRepository.findByScreeningIdOrderByCreatedAtAsc(screeningId))
          .thenReturn(List.of());

      List<ChatMessageResponse> results = chatService.getScreeningMessages(screeningId);

      assertThat(results).isEmpty();
    }
  }

  @Nested
  @DisplayName("markMessagesAsRead Tests")
  class MarkMessagesAsReadTests {

    @Test
    @DisplayName("Filters unread messages by sender and marks them as read")
    void markMessagesAsRead_OnlyMarksTargetSenderMessages() {
      UUID otherSenderId = UUID.randomUUID();

      ChatMessage msgFromTargetSender1 =
          new ChatMessage(doctorId, patientId, null, "Lời dặn 1", null);
      ReflectionTestUtils.setField(msgFromTargetSender1, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(msgFromTargetSender1, "isRead", false);

      ChatMessage msgFromTargetSender2 =
          new ChatMessage(doctorId, patientId, null, "Lời dặn 2", null);
      ReflectionTestUtils.setField(msgFromTargetSender2, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(msgFromTargetSender2, "isRead", false);

      ChatMessage msgFromOtherSender =
          new ChatMessage(otherSenderId, patientId, null, "Tin nhắn từ người khác", null);
      ReflectionTestUtils.setField(msgFromOtherSender, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(msgFromOtherSender, "isRead", false);

      when(chatMessageRepository.findByReceiverIdAndIsReadFalse(patientId))
          .thenReturn(List.of(msgFromTargetSender1, msgFromTargetSender2, msgFromOtherSender));

      chatService.markMessagesAsRead(patientId, doctorId);

      assertThat(msgFromTargetSender1.getIsRead()).isTrue();
      assertThat(msgFromTargetSender1.getReadAt()).isNotNull();

      assertThat(msgFromTargetSender2.getIsRead()).isTrue();
      assertThat(msgFromTargetSender2.getReadAt()).isNotNull();

      // The other sender's message was untouched
      assertThat(msgFromOtherSender.getIsRead()).isFalse();
      assertThat(msgFromOtherSender.getReadAt()).isNull();

      @SuppressWarnings("unchecked")
      ArgumentCaptor<List<ChatMessage>> captor = ArgumentCaptor.forClass(List.class);
      verify(chatMessageRepository).saveAll(captor.capture());

      List<ChatMessage> savedList = captor.getValue();
      assertThat(savedList).containsExactlyInAnyOrder(msgFromTargetSender1, msgFromTargetSender2);
    }

    @Test
    @DisplayName("When no unread messages match sender, saveAll is called with empty list")
    void markMessagesAsRead_NoMatchingMessages_SavesEmptyList() {
      when(chatMessageRepository.findByReceiverIdAndIsReadFalse(patientId))
          .thenReturn(List.of());

      chatService.markMessagesAsRead(patientId, doctorId);

      verify(chatMessageRepository).saveAll(List.of());
    }
  }

  @Nested
  @DisplayName("getUnreadCount Tests")
  class GetUnreadCountTests {

    @Test
    @DisplayName("Returns unread message count correctly")
    void getUnreadCount_ReturnsCount() {
      when(chatMessageRepository.countByReceiverIdAndIsReadFalse(patientId)).thenReturn(5L);

      long count = chatService.getUnreadCount(patientId);

      assertThat(count).isEqualTo(5L);
      verify(chatMessageRepository).countByReceiverIdAndIsReadFalse(patientId);
    }
  }
}
