package com.aura.notification.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import com.aura.notification.dto.UserNotificationDto;
import com.aura.notification.service.UserNotificationService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@ExtendWith(MockitoExtension.class)
class UserNotificationControllerUnitTest {

  @Mock
  private UserNotificationService userNotificationService;

  private UserNotificationController controller;

  private UUID userId;
  private AuraUserPrincipal userPrincipal;
  private UserNotificationDto sampleNotification;

  @BeforeEach
  void setUp() {
    controller = new UserNotificationController(userNotificationService);

    userId = UUID.randomUUID();
    userPrincipal = new AuraUserPrincipal(userId, "patient@aura.test", "secret", true, List.of("ROLE_USER"));

    sampleNotification = new UserNotificationDto(
        UUID.randomUUID(), userId, "Kết quả phân tích võng mạc",
        "Ca sàng lọc của bạn đã có kết quả từ AI.", "SCREENING_RESULT",
        "INFO", "/patient/screenings", false, Instant.now()
    );
  }

  @Nested
  @DisplayName("GET /api/v1/notifications/stream - Đăng ký SSE Stream thông báo tức thời (FR-9)")
  class StreamNotificationsTests {

    @Test
    @DisplayName("Thành công: Khởi tạo SseEmitter cho người dùng")
    void streamNotifications_success() {
      SseEmitter emitter = new SseEmitter(60000L);
      when(userNotificationService.subscribe(eq(userId))).thenReturn(emitter);

      SseEmitter result = controller.streamNotifications(userPrincipal);

      assertThat(result).isNotNull();
      assertThat(result).isEqualTo(emitter);
      verify(userNotificationService).subscribe(eq(userId));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/notifications - Lấy danh sách thông báo")
  class GetNotificationsTests {

    @Test
    @DisplayName("Thành công: Lấy toàn bộ danh sách thông báo của người dùng")
    void getNotifications_success() {
      when(userNotificationService.getUserNotifications(eq(userId))).thenReturn(List.of(sampleNotification));

      ApiResponse<List<UserNotificationDto>> response = controller.getNotifications(userPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Lấy danh sách thông báo thành công");
      assertThat(response.data()).hasSize(1);
      assertThat(response.data().get(0).title()).isEqualTo("Kết quả phân tích võng mạc");
      verify(userNotificationService).getUserNotifications(eq(userId));
    }

    @Test
    @DisplayName("Thành công: Lấy danh sách thông báo có phân trang")
    void getNotificationsPaged_success() {
      Page<UserNotificationDto> page = new PageImpl<>(List.of(sampleNotification), PageRequest.of(0, 20), 1);
      when(userNotificationService.getUserNotificationsPaged(eq(userId), any(Pageable.class))).thenReturn(page);

      ApiResponse<PageResponse<UserNotificationDto>> response =
          controller.getNotificationsPaged(userPrincipal, 0, 20);

      assertThat(response).isNotNull();
      assertThat(response.data()).isNotNull();
      assertThat(response.data().items()).hasSize(1);
      verify(userNotificationService).getUserNotificationsPaged(eq(userId), any(Pageable.class));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/notifications/unread-count - Số lượng thông báo chưa đọc")
  class UnreadCountTests {

    @Test
    @DisplayName("Thành công: Trả về số lượng thông báo chưa đọc")
    void getUnreadCount_success() {
      when(userNotificationService.getUnreadCount(eq(userId))).thenReturn(5L);

      ApiResponse<Map<String, Long>> response = controller.getUnreadCount(userPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.data()).isNotNull();
      assertThat(response.data().get("unreadCount")).isEqualTo(5L);
      verify(userNotificationService).getUnreadCount(eq(userId));
    }
  }

  @Nested
  @DisplayName("Đánh dấu thông báo đã đọc (Mark Read)")
  class MarkReadTests {

    @Test
    @DisplayName("PUT /{id}/read - Đánh dấu một thông báo đã đọc")
    void markAsRead_success() {
      UUID notificationId = sampleNotification.id();
      UserNotificationDto readNotification = new UserNotificationDto(
          notificationId, userId, sampleNotification.title(), sampleNotification.message(),
          sampleNotification.type(), sampleNotification.severity(), sampleNotification.linkUrl(),
          true, sampleNotification.createdAt()
      );
      when(userNotificationService.markAsRead(eq(userId), eq(notificationId))).thenReturn(readNotification);

      ApiResponse<UserNotificationDto> response = controller.markAsRead(userPrincipal, notificationId);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã đánh dấu đã đọc");
      assertThat(response.data().isRead()).isTrue();
      verify(userNotificationService).markAsRead(eq(userId), eq(notificationId));
    }

    @Test
    @DisplayName("PUT /read-all - Đánh dấu toàn bộ thông báo đã đọc")
    void markAllAsRead_success() {
      ApiResponse<Void> response = controller.markAllAsRead(userPrincipal);

      assertThat(response).isNotNull();
      assertThat(response.message()).isEqualTo("Đã đánh dấu tất cả thông báo đã đọc");
      verify(userNotificationService).markAllAsRead(eq(userId));
    }
  }
}
