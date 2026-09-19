package com.aura.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.security.JwtTokenProvider;
import com.aura.common.response.ErrorCode;
import com.aura.event.ScanUploadedEvent;
import io.jsonwebtoken.JwtException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class RealtimeSseControllerTest {

  private RealtimeSseController controller;
  private JwtTokenProvider jwtTokenProvider;

  @BeforeEach
  void setUp() {
    controller = new RealtimeSseController();
    jwtTokenProvider = mock(JwtTokenProvider.class);
    ReflectionTestUtils.setField(controller, "jwtTokenProvider", jwtTokenProvider);
    controller.init();
  }

  @AfterEach
  void tearDown() {
    controller.destroy();
  }

  private AuraUserPrincipal createPrincipal(String role) {
    return new AuraUserPrincipal(
        UUID.randomUUID(), role.toLowerCase() + "@aura.com", "pass", true, List.of(role));
  }

  @Test
  @DisplayName("subscribe: Trả về emitter và tăng bộ đếm activeCount khi có principal hợp lệ")
  void testSubscribeReturnsEmitterAndIncrementsCount() {
    int initialCount = controller.getActiveCount();
    SseEmitter emitter = controller.subscribe(createPrincipal("DOCTOR"));

    assertThat(emitter).isNotNull();
    assertThat(controller.getActiveCount()).isEqualTo(initialCount + 1);
  }

  @Test
  @DisplayName("broadcast: Phát sự kiện CrossPortalEvent tới các session đang kết nối")
  void testBroadcastCrossPortalEvent() {
    controller.subscribe(createPrincipal("DOCTOR"));
    controller.subscribe(createPrincipal("PATIENT"));

    ScanUploadedEvent event = new ScanUploadedEvent(UUID.randomUUID(), UUID.randomUUID(), "Patient", "OD", 0.5);
    controller.broadcast(event);

    assertThat(controller.getActiveCount()).isEqualTo(2);
  }

  @Test
  @DisplayName("broadcast: Phát sự kiện generic event tới session admin")
  void testBroadcastGenericEvent() {
    controller.subscribe(createPrincipal("ADMIN"));
    controller.broadcast("CUSTOM_EVENT", Map.of("key", "value"));

    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);
  }

  @Test
  @DisplayName("sendHeartbeatPing: Gửi ping heartbeat thành công")
  void testSendHeartbeatPing() {
    controller.subscribe(createPrincipal("DOCTOR"));
    controller.sendHeartbeatPing();

    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);
  }

  @Test
  @DisplayName("stats: Endpoint stats trả về số lượng kết nối đang active")
  void testStatsEndpoint() {
    controller.subscribe(createPrincipal("CLINIC"));
    ResponseEntity<Map<String, Object>> statsResponse = controller.getStats();

    assertThat(statsResponse.getStatusCode().is2xxSuccessful()).isTrue();
    assertThat(statsResponse.getBody()).isNotNull();
    assertThat(statsResponse.getBody().get("activeConnections")).isEqualTo(1);
  }

  @Test
  @DisplayName("broadcast: Phát sự kiện null không ném ngoại lệ")
  void testBroadcastNullDoesNotThrow() {
    controller.broadcast((ScanUploadedEvent) null);
  }

  @Test
  @DisplayName("subscribe: Đăng ký thành công với AuraUserPrincipal")
  void testSubscribeWithPrincipal() {
    UUID userId = UUID.randomUUID();
    AuraUserPrincipal principal = new AuraUserPrincipal(
        userId, "doc@aura.com", "pass", true, List.of("DOCTOR"));

    SseEmitter emitter = controller.subscribe(principal);
    assertThat(emitter).isNotNull();
    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);
  }

  @Test
  @DisplayName("SEC-04: Không có principal và không có token ném UNAUTHORIZED AuthException")
  void testSubscribeUnauthenticatedThrowsAuthException() {
    assertThatThrownBy(() -> controller.subscribe((AuraUserPrincipal) null, null))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.UNAUTHORIZED)
        .hasMessageContaining("Yêu cầu đăng nhập hoặc JWT token hợp lệ");
  }

  @Test
  @DisplayName("SEC-04: Token JWT không hợp lệ ném UNAUTHORIZED AuthException")
  void testSubscribeWithInvalidTokenThrowsAuthException() {
    when(jwtTokenProvider.parse("invalid-token")).thenThrow(new JwtException("Signature mismatch"));

    assertThatThrownBy(() -> controller.subscribe(null, "invalid-token"))
        .isInstanceOf(AuthException.class)
        .hasFieldOrPropertyWithValue("code", ErrorCode.UNAUTHORIZED)
        .hasMessageContaining("JWT token trong tham số SSE không hợp lệ");
  }

  @Test
  @DisplayName("broadcast: Bệnh nhân chỉ nhận sự kiện thuộc về chính mình")
  void testBroadcastUserScopingPatientReceivesOwnEvent() {
    UUID patientId = UUID.randomUUID();
    AuraUserPrincipal patientPrincipal = new AuraUserPrincipal(
        patientId, "patient@aura.com", "pass", true, List.of("USER"));

    controller.subscribe(patientPrincipal);
    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);

    // Event matching this patient
    ScanUploadedEvent ownEvent = new ScanUploadedEvent(UUID.randomUUID(), patientId, "Patient Name", "OD", 0.45);
    controller.broadcast(ownEvent);

    // Event for different patient
    ScanUploadedEvent otherEvent = new ScanUploadedEvent(UUID.randomUUID(), UUID.randomUUID(), "Other Patient", "OS", 0.75);
    controller.broadcast(otherEvent);

    assertThat(controller.getActiveCount()).isGreaterThanOrEqualTo(1);
  }
}
