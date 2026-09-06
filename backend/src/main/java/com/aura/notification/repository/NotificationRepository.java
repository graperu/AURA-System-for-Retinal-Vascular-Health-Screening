package com.aura.notification.repository;

import com.aura.notification.entity.AppNotification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<AppNotification, UUID> {
  List<AppNotification> findByUserIdOrderByCreatedAtDesc(UUID userId);

  long countByUserIdAndReadFalse(UUID userId);
}
