package com.aura.chat.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SendMessageRequest(
    @JsonProperty("receiverId")
    @NotNull(message = "Receiver ID is required") UUID receiverId,

    @JsonProperty("screeningId")
    UUID screeningId,

    @JsonProperty("messageText")
    @JsonAlias("content")
    @NotBlank(message = "Message text is required") String messageText,

    @JsonProperty("attachmentUrl")
    String attachmentUrl) {}

