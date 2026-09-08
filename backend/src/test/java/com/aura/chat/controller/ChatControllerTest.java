package com.aura.chat.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.service.ChatService;
import com.aura.common.response.ApiResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

  @Mock
  private ChatService chatService;

  private ChatController controller;

  private AuraUserPrincipal userPrincipal;
  private UUID userId;
  private UUID doctorId;

  @BeforeEach
  void setUp() {
    controller = new ChatController(chatService);
    userId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    userPrincipal = new AuraUserPrincipal(userId, "patient@aura.com", "pass", true, List.of("USER"));
  }

  @Test
  @DisplayName("FR-10, FR-20: Gửi tin nhắn tư vấn thành công")
  void sendMessage_success() {
    SendMessageRequest req = new SendMessageRequest(doctorId, null, "Xin chào bác sĩ", null);
    ChatMessageResponse msgResponse = new ChatMessageResponse(
        UUID.randomUUID(), userId, doctorId, null, "Xin chào bác sĩ", null, false, null, Instant.now()
    );

    when(chatService.sendMessage(eq(userId), eq(req))).thenReturn(msgResponse);

    ApiResponse<ChatMessageResponse> response = controller.sendMessage(userPrincipal, req);

    assertNotNull(response);
    assertEquals("Xin chào bác sĩ", response.data().messageText());
  }

  @Test
  @DisplayName("FR-10, FR-20: Lấy lịch sử hội thoại thành công")
  void getConversation_success() {
    ChatMessageResponse msg1 = new ChatMessageResponse(
        UUID.randomUUID(), userId, doctorId, null, "Chào BS", null, false, null, Instant.now()
    );
    when(chatService.getConversation(eq(userId), eq(doctorId))).thenReturn(List.of(msg1));

    ApiResponse<List<ChatMessageResponse>> response = controller.getConversation(userPrincipal, doctorId);

    assertNotNull(response);
    assertEquals(1, response.data().size());
  }

  @Test
  @DisplayName("Đánh dấu tin nhắn đã đọc")
  void markAsRead_success() {
    ApiResponse<Void> response = controller.markAsRead(userPrincipal, doctorId);
    assertNotNull(response);
    verify(chatService).markMessagesAsRead(eq(userId), eq(doctorId));
  }
}
