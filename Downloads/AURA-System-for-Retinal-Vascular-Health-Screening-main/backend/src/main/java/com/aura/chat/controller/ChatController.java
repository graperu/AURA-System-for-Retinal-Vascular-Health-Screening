package com.aura.chat.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.chat.dto.ChatMessageResponse;
import com.aura.chat.dto.SendMessageRequest;
import com.aura.chat.service.ChatService;
import com.aura.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
@Tag(name = "In-App Consultation Chat", description = "Endpoints for doctor-patient consultation messaging (FR-10, FR-20)")
public class ChatController {

  private final ChatService chatService;

  public ChatController(ChatService chatService) {
    this.chatService = chatService;
  }

  @PostMapping("/messages")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Send a consultation message")
  public ApiResponse<ChatMessageResponse> sendMessage(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody SendMessageRequest request) {
    ChatMessageResponse response = chatService.sendMessage(principal.getId(), request);
    return ApiResponse.success(response);
  }

  @GetMapping("/conversation/{otherUserId}")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Get conversation history with another user")
  public ApiResponse<List<ChatMessageResponse>> getConversation(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID otherUserId) {
    List<ChatMessageResponse> messages =
        chatService.getConversation(principal.getId(), otherUserId);
    return ApiResponse.success(messages);
  }

  @GetMapping("/screening/{screeningId}")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Get messages associated with a screening case")
  public ApiResponse<List<ChatMessageResponse>> getScreeningMessages(
      @PathVariable UUID screeningId) {
    return ApiResponse.success(chatService.getScreeningMessages(screeningId));
  }

  @GetMapping("/conversations")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Get all recent consultation conversations for the current user")
  public ApiResponse<List<com.aura.chat.dto.ConversationSummaryResponse>> getRecentConversations(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(chatService.getRecentConversations(principal.getId()));
  }

  @PutMapping("/read/{senderId}")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Mark messages from sender as read")
  public ApiResponse<Void> markAsRead(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @PathVariable UUID senderId) {
    chatService.markMessagesAsRead(principal.getId(), senderId);
    return ApiResponse.success(null);
  }
}
