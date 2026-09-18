package com.aura.controller;

import com.aura.event.CrossPortalEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Server-Sent Events (SSE) Controller for streaming real-time events across portals.
 * Supports connections at /api/v1/events/stream (and /api/events/stream),
 * automatic heartbeat pinging every 25 seconds, and reliable emitter lifecycle management.
 */
@RestController
@Tag(name = "Realtime Events", description = "Endpoints for Server-Sent Events (SSE) streaming")
public class RealtimeSseController {

  private static final Logger log = LoggerFactory.getLogger(RealtimeSseController.class);
  private static final long SSE_TIMEOUT_MS = 30 * 60 * 1000L; // 30 minutes
  private static final long HEARTBEAT_INTERVAL_SEC = 25L; // 25 seconds heartbeat

  private final ConcurrentHashMap<String, EmitterSession> activeSessions = new ConcurrentHashMap<>();
  private ScheduledExecutorService heartbeatExecutor;

  public record EmitterSession(
      String sessionId,
      SseEmitter emitter,
      long connectedAt,
      String userId,
      String role
  ) {}

  @PostConstruct
  public void init() {
    heartbeatExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
      Thread t = new Thread(r, "aura-sse-heartbeat");
      t.setDaemon(true);
      return t;
    });
    heartbeatExecutor.scheduleAtFixedRate(
        this::sendHeartbeatPing,
        HEARTBEAT_INTERVAL_SEC,
        HEARTBEAT_INTERVAL_SEC,
        TimeUnit.SECONDS
    );
    log.info("RealtimeSseController initialized with 25s heartbeat interval.");
  }

  @PreDestroy
  public void destroy() {
    if (heartbeatExecutor != null && !heartbeatExecutor.isShutdown()) {
      heartbeatExecutor.shutdownNow();
    }
    activeSessions.forEach((id, session) -> {
      try {
        session.emitter().complete();
      } catch (Exception ignored) {
      }
    });
    activeSessions.clear();
  }

  /**
   * Primary SSE stream subscription endpoint.
   * Clients connect to receive domain events real-time.
   */
  @Operation(summary = "Subscribe to real-time domain events via Server-Sent Events (SSE)")
  @GetMapping(value = {"/api/v1/events/stream", "/api/events/stream"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter subscribe(
      @RequestParam(name = "token", required = false) String token,
      @RequestParam(name = "userId", required = false) String userId,
      @RequestParam(name = "role", required = false) String role
  ) {
    String sessionId = UUID.randomUUID().toString();
    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
    EmitterSession session = new EmitterSession(sessionId, emitter, System.currentTimeMillis(), userId, role);

    activeSessions.put(sessionId, session);
    log.info("SSE client connected: sessionId={}, userId={}, role={}, activeCount={}",
        sessionId, userId, role, activeSessions.size());

    // Register lifecycle listeners
    emitter.onCompletion(() -> {
      log.debug("SSE completed for sessionId: {}", sessionId);
      removeSession(sessionId);
    });

    emitter.onTimeout(() -> {
      log.debug("SSE timed out for sessionId: {}", sessionId);
      emitter.complete();
      removeSession(sessionId);
    });

    emitter.onError((ex) -> {
      log.debug("SSE error for sessionId {}: {}", sessionId, ex.getMessage());
      emitter.complete();
      removeSession(sessionId);
    });

    // Send initial handshake event
    try {
      emitter.send(SseEmitter.event()
          .id(sessionId)
          .name("CONNECTED")
          .data(Map.of(
              "status", "CONNECTED",
              "sessionId", sessionId,
              "timestamp", System.currentTimeMillis(),
              "message", "AURA SSE Stream successfully connected"
          ))
      );
    } catch (IOException e) {
      log.warn("Failed to send initial handshake event to sessionId {}: {}", sessionId, e.getMessage());
      removeSession(sessionId);
    }

    return emitter;
  }

  /**
   * Broadcasts a CrossPortalEvent domain event to all connected SSE clients.
   */
  public void broadcast(CrossPortalEvent event) {
    if (event == null || activeSessions.isEmpty()) {
      return;
    }

    String eventType = event.getEventType() != null ? event.getEventType() : "CROSS_PORTAL_EVENT";
    String eventId = event.getEventId() != null ? event.getEventId() : UUID.randomUUID().toString();

    List<String> staleSessionIds = new ArrayList<>();

    activeSessions.forEach((sessionId, session) -> {
      try {
        session.emitter().send(SseEmitter.event()
            .id(eventId)
            .name(eventType)
            .data(event)
        );
      } catch (Exception e) {
        log.debug("Failed to deliver SSE event {} to session {}: {}", eventId, sessionId, e.getMessage());
        staleSessionIds.add(sessionId);
      }
    });

    staleSessionIds.forEach(this::removeSession);
  }

  /**
   * Generic broadcast helper for sending arbitrary typed payloads.
   */
  public void broadcast(String eventType, Object data) {
    if (activeSessions.isEmpty()) {
      return;
    }

    String eventId = UUID.randomUUID().toString();
    List<String> staleSessionIds = new ArrayList<>();

    activeSessions.forEach((sessionId, session) -> {
      try {
        session.emitter().send(SseEmitter.event()
            .id(eventId)
            .name(eventType)
            .data(data)
        );
      } catch (Exception e) {
        log.debug("Failed to deliver generic SSE event {} to session {}: {}", eventId, sessionId, e.getMessage());
        staleSessionIds.add(sessionId);
      }
    });

    staleSessionIds.forEach(this::removeSession);
  }

  /**
   * Heartbeat ping sent every 25 seconds to keep active connections alive.
   * Can be triggered by Spring's @Scheduled or internal ScheduledExecutorService.
   */
  @Scheduled(fixedRate = 25000)
  public void sendHeartbeatPing() {
    if (activeSessions.isEmpty()) {
      return;
    }

    long now = System.currentTimeMillis();
    List<String> deadSessions = new ArrayList<>();

    activeSessions.forEach((sessionId, session) -> {
      try {
        session.emitter().send(SseEmitter.event()
            .name("ping")
            .comment("heartbeat")
            .data(Map.of("type", "PING", "timestamp", now))
        );
      } catch (Exception e) {
        log.debug("Heartbeat ping failed for session {}: {}", sessionId, e.getMessage());
        deadSessions.add(sessionId);
      }
    });

    deadSessions.forEach(this::removeSession);
  }

  /**
   * Returns current active SSE connection count.
   */
  @GetMapping("/api/v1/events/stats")
  public ResponseEntity<Map<String, Object>> getStats() {
    return ResponseEntity.ok(Map.of(
        "activeConnections", activeSessions.size(),
        "timestamp", System.currentTimeMillis()
    ));
  }

  public int getActiveCount() {
    return activeSessions.size();
  }

  private void removeSession(String sessionId) {
    EmitterSession session = activeSessions.remove(sessionId);
    if (session != null) {
      log.debug("Removed SSE session: {}, remaining active: {}", sessionId, activeSessions.size());
    }
  }
}
