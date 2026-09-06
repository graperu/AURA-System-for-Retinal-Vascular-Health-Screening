package com.aura.chat.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "sender_id", nullable = false)
  private UUID senderId;

  @Column(name = "receiver_id", nullable = false)
  private UUID receiverId;

  @Column(name = "screening_id")
  private UUID screeningId;

  @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
  private String messageText;

  @Column(name = "attachment_url", length = 512)
  private String attachmentUrl;

  @Column(name = "is_read", nullable = false)
  private Boolean isRead = false;

  @Column(name = "read_at")
  private Instant readAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected ChatMessage() {}

  public ChatMessage(
      UUID senderId,
      UUID receiverId,
      UUID screeningId,
      String messageText,
      String attachmentUrl) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.screeningId = screeningId;
    this.messageText = messageText;
    this.attachmentUrl = attachmentUrl;
    this.isRead = false;
  }

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public UUID getId() {
    return id;
  }

  public UUID getSenderId() {
    return senderId;
  }

  public UUID getReceiverId() {
    return receiverId;
  }

  public UUID getScreeningId() {
    return screeningId;
  }

  public String getMessageText() {
    return messageText;
  }

  public String getAttachmentUrl() {
    return attachmentUrl;
  }

  public Boolean getIsRead() {
    return isRead;
  }

  public void markAsRead() {
    this.isRead = true;
    this.readAt = Instant.now();
  }

  public Instant getReadAt() {
    return readAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
