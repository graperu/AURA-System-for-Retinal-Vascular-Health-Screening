package com.aura.chat.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.service.ChatService;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@ExtendWith(MockitoExtension.class)
class ChatControllerComprehensiveTest {

  @Mock
  private ChatService chatService;

  @InjectMocks
  private ChatController controller;

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  private UUID currentUserId;
  private UUID receiverId;
  private UUID screeningId;
  private AuraUserPrincipal currentPrincipal;
  private ChatMessageResponse sampleMessageResponse;

  @BeforeEach
  void setUp() {
    currentUserId = UUID.randomUUID();
    receiverId = UUID.randomUUID();
    screeningId = UUID.randomUUID();
    currentPrincipal = new AuraUserPrincipal(
        currentUserId,
        "patient@aura.test",
        "EncryptedPass123!",
        true,
        List.of("USER")
    );
    objectMapper = new ObjectMapper();

    sampleMessageResponse = new ChatMessageResponse(
        UUID.randomUUID(),
        currentUserId,
        receiverId,
        screeningId,
        "Xin chào bác sĩ, tôi muốn tư vấn kết quả võng mạc",
        "https://storage.aura.test/attach.png",
        false,
        null,
        Instant.now()
    );

    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
          @Override
          public boolean supportsParameter(MethodParameter parameter) {
            return parameter.getParameterType().isAssignableFrom(AuraUserPrincipal.class);
          }

          @Override
          public Object resolveArgument(MethodParameter parameter,
                                        ModelAndViewContainer mavContainer,
                                        NativeWebRequest webRequest,
                                        WebDataBinderFactory binderFactory) {
            return currentPrincipal;
          }
        })
        .build();
  }

  @Nested
  @DisplayName("POST /api/v1/chat/messages - Gửi tin nhắn tư vấn (FR-10, FR-20)")
  class SendMessageTests {

    @Test
    @DisplayName("Gửi tin nhắn thành công -> HTTP 200 và trả về thông tin tin nhắn")
    void sendMessage_success() throws Exception {
      SendMessageRequest request = new SendMessageRequest(
          receiverId, screeningId, "Xin chào bác sĩ, tôi muốn tư vấn kết quả võng mạc", "https://storage.aura.test/attach.png"
      );
      when(chatService.sendMessage(eq(currentUserId), any(SendMessageRequest.class)))
          .thenReturn(sampleMessageResponse);

      mockMvc.perform(post("/api/v1/chat/messages")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.senderId").value(currentUserId.toString()))
          .andExpect(jsonPath("$.data.receiverId").value(receiverId.toString()))
          .andExpect(jsonPath("$.data.messageText").value("Xin chào bác sĩ, tôi muốn tư vấn kết quả võng mạc"));

      verify(chatService).sendMessage(eq(currentUserId), any(SendMessageRequest.class));
    }

    @Test
    @DisplayName("Gửi tin nhắn thất bại do thiếu người nhận hoặc nội dung trống -> HTTP 400 VALIDATION_ERROR")
    void sendMessage_validationError() throws Exception {
      SendMessageRequest invalidRequest = new SendMessageRequest(null, null, "", null);

      mockMvc.perform(post("/api/v1/chat/messages")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/chat/conversation/{otherUserId} - Lịch sử cuộc trò chuyện")
  class GetConversationTests {

    @Test
    @DisplayName("Lấy lịch sử hội thoại thành công -> HTTP 200")
    void getConversation_success() throws Exception {
      when(chatService.getConversation(eq(currentUserId), eq(receiverId)))
          .thenReturn(List.of(sampleMessageResponse));

      mockMvc.perform(get("/api/v1/chat/conversation/{otherUserId}", receiverId))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].senderId").value(currentUserId.toString()))
          .andExpect(jsonPath("$.data[0].receiverId").value(receiverId.toString()));

      verify(chatService).getConversation(currentUserId, receiverId);
    }
  }

  @Nested
  @DisplayName("GET /api/v1/chat/screening/{screeningId} - Tin nhắn liên quan ca sàng lọc")
  class GetScreeningMessagesTests {

    @Test
    @DisplayName("Lấy danh sách tin nhắn theo ca sàng lọc thành công -> HTTP 200")
    void getScreeningMessages_success() throws Exception {
      when(chatService.getScreeningMessages(eq(screeningId)))
          .thenReturn(List.of(sampleMessageResponse));

      mockMvc.perform(get("/api/v1/chat/screening/{screeningId}", screeningId))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].screeningId").value(screeningId.toString()));

      verify(chatService).getScreeningMessages(screeningId);
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/chat/read/{senderId} - Đánh dấu tin nhắn đã đọc")
  class MarkAsReadTests {

    @Test
    @DisplayName("Đánh dấu tin nhắn đã đọc thành công -> HTTP 200")
    void markAsRead_success() throws Exception {
      doNothing().when(chatService).markMessagesAsRead(eq(currentUserId), eq(receiverId));

      mockMvc.perform(put("/api/v1/chat/read/{senderId}", receiverId))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true));

      verify(chatService).markMessagesAsRead(currentUserId, receiverId);
    }
  }

  @Test
  @DisplayName("Direct method invocation coverage")
  void directMethodCoverage_test() {
    SendMessageRequest req = new SendMessageRequest(receiverId, null, "Tin nhắn thử", null);
    when(chatService.sendMessage(eq(currentUserId), eq(req))).thenReturn(sampleMessageResponse);

    ApiResponse<ChatMessageResponse> res = controller.sendMessage(currentPrincipal, req);
    assertThat(res.success()).isTrue();
    assertThat(res.data().messageText()).contains("tư vấn");

    when(chatService.getConversation(eq(currentUserId), eq(receiverId)))
        .thenReturn(List.of(sampleMessageResponse));
    ApiResponse<List<ChatMessageResponse>> convRes = controller.getConversation(currentPrincipal, receiverId);
    assertThat(convRes.data()).hasSize(1);
  }
}
