package com.aura.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.notification.dto.UserNotificationDto;
import com.aura.notification.entity.UserNotification;
import com.aura.notification.repository.UserNotificationRepository;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@ExtendWith(MockitoExtension.class)
class UserNotificationServiceTest {

  @Mock private UserNotificationRepository notificationRepository;

  @InjectMocks private UserNotificationService service;

  private UUID userId;
  private UUID otherUserId;
  private UUID notificationId;
  private UserNotification notification;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    otherUserId = UUID.randomUUID();
    notificationId = UUID.randomUUID();

    notification = new UserNotification(
        userId,
        "Kết quả sàng lọc AI sẵn sàng",
        "Hồ sơ phân tích vi mạch của bạn đã có kết quả sơ bộ.",
        "AI_READY",
        "INFO",
        "/screenings/123"
    );
    ReflectionTestUtils.setField(notification, "id", notificationId);
  }

  @Nested
  @DisplayName("subscribe tests")
  class SubscribeTests {

    @Test
    @DisplayName("subscribe returns SseEmitter and stores it in active emitters")
    @SuppressWarnings("unchecked")
    void subscribe_ReturnsEmitter() {
      // Act
      SseEmitter emitter = service.subscribe(userId);

      // Assert
      assertThat(emitter).isNotNull();
      Map<UUID, List<SseEmitter>> emitters = (Map<UUID, List<SseEmitter>>) ReflectionTestUtils.getField(service, "emitters");
      assertThat(emitters).containsKey(userId);
      assertThat(emitters.get(userId)).contains(emitter);
    }
  }

  @Nested
  @DisplayName("sendNotificationToUser tests")
  class SendNotificationTests {

    @Test
    @DisplayName("sendNotificationToUser saves entity and returns UserNotificationDto")
    void sendNotificationToUser_Success() {
      // Arrange
      when(notificationRepository.save(any(UserNotification.class))).thenAnswer(i -> {
        UserNotification n = i.getArgument(0);
        ReflectionTestUtils.setField(n, "id", notificationId);
        return n;
      });

      // Act
      UserNotificationDto dto = service.sendNotificationToUser(
          userId,
          "Thông báo mới",
          "Nội dung thông báo",
          "ALERT",
          "CRITICAL",
          "/dashboard"
      );

      // Assert
      assertThat(dto).isNotNull();
      assertThat(dto.id()).isEqualTo(notificationId);
      assertThat(dto.userId()).isEqualTo(userId);
      assertThat(dto.title()).isEqualTo("Thông báo mới");
      assertThat(dto.type()).isEqualTo("ALERT");
      assertThat(dto.severity()).isEqualTo("CRITICAL");
      assertThat(dto.isRead()).isFalse();
      verify(notificationRepository).save(any(UserNotification.class));
    }

    @Test
    @DisplayName("sendNotificationToUser pushes to registered SSE emitter and handles error gracefully")
    @SuppressWarnings("unchecked")
    void sendNotificationToUser_PushesToSse_AndRemovesFailedEmitter() throws Exception {
      // Arrange
      when(notificationRepository.save(any(UserNotification.class))).thenReturn(notification);

      SseEmitter mockEmitter = mock(SseEmitter.class);
      doThrow(new IOException("Broken pipe")).when(mockEmitter).send(any(SseEmitter.SseEventBuilder.class));

      Map<UUID, List<SseEmitter>> emitters = (Map<UUID, List<SseEmitter>>) ReflectionTestUtils.getField(service, "emitters");
      emitters.computeIfAbsent(userId, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(mockEmitter);

      // Act
      UserNotificationDto dto = service.sendNotificationToUser(
          userId,
          "Title",
          "Message",
          "SYSTEM",
          "INFO",
          null
      );

      // Assert
      assertThat(dto).isNotNull();
      // Failed emitter should be removed
      assertThat(emitters.get(userId)).isNull();
    }
  }

  @Nested
  @DisplayName("getUserNotifications tests")
  class GetNotificationsTests {

    @Test
    @DisplayName("getUserNotifications returns list of user notifications")
    void getUserNotifications_ReturnsList() {
      // Arrange
      when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
          .thenReturn(List.of(notification));

      // Act
      List<UserNotificationDto> result = service.getUserNotifications(userId);

      // Assert
      assertThat(result).hasSize(1);
      assertThat(result.get(0).title()).isEqualTo("Kết quả sàng lọc AI sẵn sàng");
    }

    @Test
    @DisplayName("getUserNotificationsPaged returns page of user notifications")
    void getUserNotificationsPaged_ReturnsPage() {
      // Arrange
      Pageable pageable = PageRequest.of(0, 10);
      when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable))
          .thenReturn(new PageImpl<>(List.of(notification), pageable, 1));

      // Act
      Page<UserNotificationDto> page = service.getUserNotificationsPaged(userId, pageable);

      // Assert
      assertThat(page).hasSize(1);
      assertThat(page.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getUnreadCount returns unread notifications count")
    void getUnreadCount_ReturnsCount() {
      // Arrange
      when(notificationRepository.countByUserIdAndReadFalse(userId)).thenReturn(5L);

      // Act
      long count = service.getUnreadCount(userId);

      // Assert
      assertThat(count).isEqualTo(5L);
    }
  }

  @Nested
  @DisplayName("markAsRead and markAllAsRead tests")
  class MarkAsReadTests {

    @Test
    @DisplayName("markAsRead marks notification as read when owned by user")
    void markAsRead_Success() {
      // Arrange
      when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));
      when(notificationRepository.save(notification)).thenReturn(notification);

      // Act
      UserNotificationDto dto = service.markAsRead(userId, notificationId);

      // Assert
      assertThat(dto.isRead()).isTrue();
      assertThat(notification.isRead()).isTrue();
      verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("markAsRead throws ResourceNotFoundException when notification not found")
    void markAsRead_NotFound_ThrowsException() {
      // Arrange
      UUID missingId = UUID.randomUUID();
      when(notificationRepository.findById(missingId)).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> service.markAsRead(userId, missingId))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("markAsRead throws IllegalArgumentException when notification belongs to another user (Anti-IDOR)")
    void markAsRead_WrongUser_ThrowsException() {
      // Arrange
      when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

      // Act & Assert
      assertThatThrownBy(() -> service.markAsRead(otherUserId, notificationId))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Bạn không có quyền thao tác trên thông báo này");
          });
      verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("markAllAsRead calls repository markAllAsReadByUserId")
    void markAllAsRead_CallsRepository() {
      // Act
      service.markAllAsRead(userId);

      // Assert
      verify(notificationRepository).markAllAsReadByUserId(userId);
    }
  }
}
