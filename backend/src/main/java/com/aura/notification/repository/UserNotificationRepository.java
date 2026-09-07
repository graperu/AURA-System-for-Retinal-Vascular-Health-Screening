package com.aura.notification.repository;

import com.aura.notification.entity.UserNotification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {

  List<UserNotification> findByUserIdOrderByCreatedAtDesc(UUID userId);

  Page<UserNotification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

  long countByUserIdAndReadFalse(UUID userId);

  @Modifying
  @Query("UPDATE UserNotification n SET n.read = true WHERE n.userId = :userId AND n.read = false")
  void markAllAsReadByUserId(@Param("userId") UUID userId);
}
