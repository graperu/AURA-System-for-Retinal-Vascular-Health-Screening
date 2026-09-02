package com.aura.chat.repository;

import com.aura.chat.entity.ChatMessage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

  @Query(
      "SELECT m FROM ChatMessage m WHERE (m.senderId = :user1 AND m.receiverId = :user2) "
          + "OR (m.senderId = :user2 AND m.receiverId = :user1) ORDER BY m.createdAt ASC")
  List<ChatMessage> findConversationBetween(
      @Param("user1") UUID user1, @Param("user2") UUID user2);

  List<ChatMessage> findByScreeningIdOrderByCreatedAtAsc(UUID screeningId);

  List<ChatMessage> findByReceiverIdAndIsReadFalse(UUID receiverId);

  @Query(
      "SELECT m FROM ChatMessage m WHERE m.senderId = :userId OR m.receiverId = :userId ORDER BY m.createdAt DESC")
  List<ChatMessage> findUserMessages(@Param("userId") UUID userId);
}
