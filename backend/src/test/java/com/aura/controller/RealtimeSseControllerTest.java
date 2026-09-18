package com.aura.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.event.ScanUploadedEvent;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class RealtimeSseControllerTest {

  private RealtimeSseController controller;

  @BeforeEach
  void setUp() {
    controller = new RealtimeSseController();
    controller.init();
  }

  @AfterEach
  void tearDown() {
    controller.destroy();
  }

  @Test
  void testSubscribeReturnsEmitterAndIncrementsCount() {
    int initialCount = controller.getActiveCount();
    SseEmitter emitter = controller.subscribe("test-token", "user-123", "DOCTOR");

    assertThat(emitter).isNotNull();
    assertThat(controller.getActiveCount()).isEqualTo(initialCount + 1);
  }

  @Test
  void testBroadcastCrossPortalEvent() {
    controller.subscribe("token-1", "user-1", "DOCTOR");
    controller.subscribe("token-2", "user-2", "PATIENT");

    ScanUploadedEvent event = new ScanUploadedEvent(UUID.randomUUID(), UUID.randomUUID(), "Patient", "OD", 0.5);
    controller.broadcast(event);

    assertThat(controller.getActiveCount()).isEqualTo(2);
  }

  @Test
  void testBroadcastGenericEvent() {
    controller.subscribe("token", "user", "ADMIN");
    controller.broadcast("CUSTOM_EVENT", Map.of("key", "value"));

    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);
  }

  @Test
  void testSendHeartbeatPing() {
    controller.subscribe("token", "user", "DOCTOR");
    controller.sendHeartbeatPing();

    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);
  }

  @Test
  void testStatsEndpoint() {
    controller.subscribe("token-1", "user-1", "CLINIC");
    ResponseEntity<Map<String, Object>> statsResponse = controller.getStats();

    assertThat(statsResponse.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(statsResponse.getBody()).isNotNull();
    assertThat(statsResponse.getBody().get("activeConnections")).isEqualTo(1);
  }

  @Test
  void testBroadcastNullDoesNotThrow() {
    controller.broadcast((ScanUploadedEvent) null);
  }
}
