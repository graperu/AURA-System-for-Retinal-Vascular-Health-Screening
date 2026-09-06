package com.aura.notification.service;

import com.aura.notification.dto.NotificationResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class NotificationSseHub {

  private static final Logger log = LoggerFactory.getLogger(NotificationSseHub.class);
  private final Map<UUID, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public SseEmitter subscribe(UUID userId) {
    SseEmitter emitter = new SseEmitter(0L);
    emitters.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);
    emitter.onCompletion(() -> remove(userId, emitter));
    emitter.onTimeout(() -> remove(userId, emitter));
    emitter.onError(e -> remove(userId, emitter));
    try {
      emitter.send(SseEmitter.event().name("connected").data("ok"));
    } catch (IOException e) {
      remove(userId, emitter);
    }
    return emitter;
  }

  public void publish(UUID userId, NotificationResponse payload) {
    List<SseEmitter> list = emitters.get(userId);
    if (list == null || list.isEmpty()) {
      return;
    }
    for (SseEmitter emitter : list) {
      try {
        emitter.send(SseEmitter.event().name("notification").data(payload));
      } catch (Exception e) {
        log.debug("SSE drop: {}", e.getMessage());
        remove(userId, emitter);
      }
    }
  }

  private void remove(UUID userId, SseEmitter emitter) {
    List<SseEmitter> list = emitters.get(userId);
    if (list != null) {
      list.remove(emitter);
    }
  }
}
