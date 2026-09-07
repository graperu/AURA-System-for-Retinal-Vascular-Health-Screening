package com.aura.notification.repository;

import com.aura.notification.entity.NotificationTemplate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, UUID> {
  Optional<NotificationTemplate> findByCodeIgnoreCase(String code);

  boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);

  List<NotificationTemplate> findAllByOrderByNameAsc();
}
