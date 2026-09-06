package com.aura.notification.repository;

import com.aura.notification.entity.NotificationPreference;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {}
