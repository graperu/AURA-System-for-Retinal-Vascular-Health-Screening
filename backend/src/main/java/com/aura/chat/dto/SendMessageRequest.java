package com.aura.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SendMessageRequest(
    @NotNull(message = "Receiver ID is required") UUID receiverId,
    UUID screeningId,
    @NotBlank(message = "Message text is required") String messageText,
    String attachmentUrl) {}
