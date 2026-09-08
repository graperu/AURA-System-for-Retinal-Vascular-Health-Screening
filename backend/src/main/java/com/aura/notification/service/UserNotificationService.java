package com.aura.notification.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.notification.dto.UserNotificationDto;
import com.aura.notification.entity.UserNotification;
import com.aura.notification.repository.UserNotificationRepository;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class UserNotificationService {

  private static final Logger log = LoggerFactory.getLogger(UserNotificationService.class);
  private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

  private final UserNotificationRepository notificationRepository;
  private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public UserNotificationService(UserNotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  public SseEmitter subscribe(UUID userId) {
    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
    emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

    emitter.onCompletion(() -> removeEmitter(userId, emitter));
    emitter.onTimeout(() -> removeEmitter(userId, emitter));
    emitter.onError(e -> removeEmitter(userId, emitter));

    // Send initial connected event
    try {
      emitter.send(
          SseEmitter.event()
              .name("CONNECTED")
              .data(Map.of("message", "Đã kết nối luồng thông báo AURA thời gian thực", "userId", userId.toString())));
    } catch (IOException e) {
      removeEmitter(userId, emitter);
    }

    return emitter;
  }

  private void removeEmitter(UUID userId, SseEmitter emitter) {
    List<SseEmitter> userEmitters = emitters.get(userId);
    if (userEmitters != null) {
      userEmitters.remove(emitter);
      if (userEmitters.isEmpty()) {
        emitters.remove(userId);
      }
    }
  }

  @Transactional
  public UserNotificationDto sendNotificationToUser(
      UUID userId,
      String title,
      String message,
      String type,
      String severity,
      String linkUrl) {
    UserNotification notification =
        new UserNotification(userId, title, message, type, severity, linkUrl);
    UserNotification saved = notificationRepository.save(notification);
    UserNotificationDto dto = UserNotificationDto.fromEntity(saved);

    // Push realtime via SSE
    pushToSse(userId, dto);
    return dto;
  }

  private void pushToSse(UUID userId, UserNotificationDto notification) {
    List<SseEmitter> userEmitters = emitters.get(userId);
    if (userEmitters != null && !userEmitters.isEmpty()) {
      for (SseEmitter emitter : userEmitters) {
        try {
          emitter.send(
              SseEmitter.event()
                  .name("NOTIFICATION")
                  .data(notification));
        } catch (Exception e) {
          log.warn("Failed to push SSE notification to user {}: {}", userId, e.getMessage());
          removeEmitter(userId, emitter);
        }
      }
    }
  }

  @Transactional(readOnly = true)
  public List<UserNotificationDto> getUserNotifications(UUID userId) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(UserNotificationDto::fromEntity)
        .toList();
  }

  @Transactional(readOnly = true)
  public Page<UserNotificationDto> getUserNotificationsPaged(UUID userId, Pageable pageable) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
        .map(UserNotificationDto::fromEntity);
  }

  @Transactional(readOnly = true)
  public long getUnreadCount(UUID userId) {
    return notificationRepository.countByUserIdAndReadFalse(userId);
  }

  @Transactional
  public UserNotificationDto markAsRead(UUID userId, UUID notificationId) {
    UserNotification notification =
        notificationRepository
            .findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
    if (!notification.getUserId().equals(userId)) {
      throw new IllegalArgumentException("Bạn không có quyền thao tác trên thông báo này");
    }
    notification.setRead(true);
    return UserNotificationDto.fromEntity(notificationRepository.save(notification));
  }

  @Transactional
  public void markAllAsRead(UUID userId) {
    notificationRepository.markAllAsReadByUserId(userId);
  }
}
