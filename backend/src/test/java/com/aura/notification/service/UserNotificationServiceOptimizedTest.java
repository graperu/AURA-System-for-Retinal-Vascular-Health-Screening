package com.aura.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.notification.dto.UserNotificationDto;
import com.aura.notification.entity.UserNotification;
import com.aura.notification.repository.UserNotificationRepository;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserNotificationService - Optimized SSE Client Disconnect & Resilience Tests")
class UserNotificationServiceOptimizedTest {

  @Mock private UserNotificationRepository notificationRepository;

  private UserNotificationService service;
  private Map<UUID, List<SseEmitter>> emittersMap;
  private UUID userId;

  @BeforeEach
  void setUp() {
    service = new UserNotificationService(notificationRepository);
    @SuppressWarnings("unchecked")
    Map<UUID, List<SseEmitter>> map =
        (Map<UUID, List<SseEmitter>>) ReflectionTestUtils.getField(service, "emitters");
    this.emittersMap = map;
    this.userId = UUID.randomUUID();
  }

  @ParameterizedTest(name = "Exception message: {0}")
  @ValueSource(strings = {"Broken pipe", "Connection reset by peer", "Client disconnected"})
  @DisplayName("sendNotificationToUser: Tự động loại bỏ emitter và không ném lỗi khi client ngắt kết nối SSE")
  void testSendNotificationHandlesClientDisconnectSafely(String errorMessage) throws Exception {
    SseEmitter brokenEmitter = mock(SseEmitter.class);
    doThrow(new IOException(errorMessage))
        .when(brokenEmitter)
        .send(any(SseEmitter.SseEventBuilder.class));

    // Đăng ký emitter bị hỏng vào danh sách người dùng
    emittersMap.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(brokenEmitter);
    assertThat(emittersMap.get(userId)).hasSize(1);

    when(notificationRepository.save(any(UserNotification.class))).thenAnswer(i -> {
      UserNotification entity = i.getArgument(0);
      ReflectionTestUtils.setField(entity, "id", UUID.randomUUID());
      return entity;
    });

    assertThatCode(() -> service.sendNotificationToUser(
        userId, "Khám hoàn tất", "Kết quả vi mạch sẵn sàng", "SCREENING", "INFO", "/screening/123"))
        .doesNotThrowAnyException();

    // Verify rằng emitter lỗi đã bị xóa khỏi map hoàn toàn
    assertThat(emittersMap.containsKey(userId)).isFalse();
  }

  @Test
  @DisplayName("sendNotificationToUser: Giữ lại emitter đang sống khi chỉ 1 trong 2 client SSE bị ngắt kết nối")
  void testSendNotificationKeepsHealthyEmitterWhenOneClientFails() throws Exception {
    SseEmitter failingEmitter = mock(SseEmitter.class);
    doThrow(new IOException("Broken pipe"))
        .when(failingEmitter)
        .send(any(SseEmitter.SseEventBuilder.class));

    SseEmitter healthyEmitter = mock(SseEmitter.class);
    doNothing().when(healthyEmitter).send(any(SseEmitter.SseEventBuilder.class));

    List<SseEmitter> list = emittersMap.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>());
    list.add(failingEmitter);
    list.add(healthyEmitter);

    when(notificationRepository.save(any(UserNotification.class))).thenAnswer(i -> {
      UserNotification entity = i.getArgument(0);
      ReflectionTestUtils.setField(entity, "id", UUID.randomUUID());
      return entity;
    });

    UserNotificationDto dto = service.sendNotificationToUser(
        userId, "Thông báo khẩn", "Huyết áp cao", "CDS_ALERT", "CRITICAL", "/cds/alert");

    assertThat(dto).isNotNull();
    verify(healthyEmitter).send(any(SseEmitter.SseEventBuilder.class));

    // Emitter lỗi bị xóa, emitter sống được giữ lại
    assertThat(emittersMap.get(userId)).containsExactly(healthyEmitter);
  }

  @Test
  @DisplayName("subscribe: Tạo SseEmitter mới và đăng ký vào bộ nhớ emitters")
  void testSubscribeCreatesEmitterAndRegistersUser() {
    SseEmitter emitter = service.subscribe(userId);

    assertThat(emitter).isNotNull();
    assertThat(emittersMap.get(userId)).contains(emitter);

    // Kích hoạt removeEmitter (hành vi của onCompletion/onTimeout/onError) -> tự động dọn dẹp khỏi map
    ReflectionTestUtils.invokeMethod(service, "removeEmitter", userId, emitter);
    assertThat(emittersMap.containsKey(userId)).isFalse();
  }

  @Test
  @DisplayName("removeEmitter: Xử lý an toàn khi xóa emitter không tồn tại hoặc danh sách rỗng")
  void testRemoveEmitterWhenNotFound() {
    SseEmitter mockEmitter = mock(SseEmitter.class);

    // Xóa khi userId chưa tồn tại
    ReflectionTestUtils.invokeMethod(service, "removeEmitter", userId, mockEmitter);
    assertThat(emittersMap.containsKey(userId)).isFalse();

    // Xóa khi userId có danh sách nhưng không chứa mockEmitter
    SseEmitter otherEmitter = mock(SseEmitter.class);
    emittersMap.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(otherEmitter);
    ReflectionTestUtils.invokeMethod(service, "removeEmitter", userId, mockEmitter);

    assertThat(emittersMap.get(userId)).containsExactly(otherEmitter);
  }

  @Test
  @DisplayName("sendNotificationToUser: Hoạt động bình thường khi người dùng không có kết nối SSE nào đang mở")
  void testSendNotificationWhenNoSseEmittersRegistered() {
    // userId chưa từng subscribe SSE (emittersMap.get(userId) == null)
    assertThat(emittersMap.containsKey(userId)).isFalse();

    when(notificationRepository.save(any(UserNotification.class))).thenAnswer(i -> {
      UserNotification n = i.getArgument(0);
      ReflectionTestUtils.setField(n, "id", UUID.randomUUID());
      return n;
    });

    UserNotificationDto dto = service.sendNotificationToUser(
        userId, "Thông báo offline", "Nội dung", "INFO", "LOW", null);

    assertThat(dto).isNotNull();
    assertThat(dto.title()).isEqualTo("Thông báo offline");
    verify(notificationRepository).save(any(UserNotification.class));
  }

  @Test
  @DisplayName("UserNotificationService: Đọc thông báo, phân trang và đếm thông báo chưa đọc")
  void testReadAndCountNotifications() {
    UserNotification notification = new UserNotification(userId, "Title", "Msg", "INFO", "LOW", null);
    when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(notification));
    when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(org.springframework.data.domain.Pageable.class)))
        .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(notification)));
    when(notificationRepository.countByUserIdAndReadFalse(userId)).thenReturn(5L);

    List<UserNotificationDto> list = service.getUserNotifications(userId);
    assertThat(list).hasSize(1);

    org.springframework.data.domain.Page<UserNotificationDto> page =
        service.getUserNotificationsPaged(userId, org.springframework.data.domain.PageRequest.of(0, 10));
    assertThat(page.getTotalElements()).isEqualTo(1);

    long unread = service.getUnreadCount(userId);
    assertThat(unread).isEqualTo(5L);
  }

  @Test
  @DisplayName("markAsRead: Đánh dấu đã đọc thành công hoặc ném ngoại lệ khi không tìm thấy / không chính chủ")
  void testMarkAsReadBranchCoverage() {
    UUID notifId = UUID.randomUUID();
    UserNotification notif = new UserNotification(userId, "Title", "Msg", "INFO", "LOW", null);

    // 1. Không tìm thấy thông báo
    when(notificationRepository.findById(notifId)).thenReturn(java.util.Optional.empty());
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.markAsRead(userId, notifId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class)
        .hasMessage("Không tìm thấy thông báo");

    // 2. Không chính chủ (userId khác)
    UUID otherUserId = UUID.randomUUID();
    when(notificationRepository.findById(notifId)).thenReturn(java.util.Optional.of(notif));
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.markAsRead(otherUserId, notifId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Bạn không có quyền thao tác trên thông báo này");

    // 3. Chính chủ -> thành công
    when(notificationRepository.save(any(UserNotification.class))).thenAnswer(i -> i.getArgument(0));
    UserNotificationDto dto = service.markAsRead(userId, notifId);
    assertThat(dto.isRead()).isTrue();

    // 4. markAllAsRead
    service.markAllAsRead(userId);
    verify(notificationRepository).markAllAsReadByUserId(userId);
  }
}
