package com.aura.notification.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.notification.dto.NotificationPreferenceResponse;
import com.aura.notification.dto.NotificationResponse;
import com.aura.notification.dto.UpdateNotificationPreferenceRequest;
import com.aura.notification.service.NotificationService;
import com.aura.notification.service.NotificationSseHub;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

  private final NotificationService notificationService;
  private final NotificationSseHub sseHub;

  public NotificationController(NotificationService notificationService, NotificationSseHub sseHub) {
    this.notificationService = notificationService;
    this.sseHub = sseHub;
  }

  @GetMapping
  public ApiResponse<List<NotificationResponse>> list(@AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success("Danh sách thông báo", notificationService.list(principal.id()));
  }

  @GetMapping("/unread-count")
  public ApiResponse<Map<String, Long>> unread(@AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(Map.of("count", notificationService.unreadCount(principal.id())));
  }

  @PatchMapping("/read-all")
  public ApiResponse<Void> readAll(@AuthenticationPrincipal AuraUserPrincipal principal) {
    notificationService.markAllRead(principal.id());
    return ApiResponse.success("Đã đánh dấu đã đọc", null);
  }

  @PatchMapping("/{id}/read")
  public ApiResponse<Void> readOne(
      @PathVariable UUID id, @AuthenticationPrincipal AuraUserPrincipal principal) {
    notificationService.markRead(principal.id(), id);
    return ApiResponse.success("Đã đọc", null);
  }

  @GetMapping("/preferences")
  public ApiResponse<NotificationPreferenceResponse> getPrefs(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(notificationService.getPreferences(principal.id()));
  }

  @PutMapping("/preferences")
  public ApiResponse<NotificationPreferenceResponse> updatePrefs(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @RequestBody UpdateNotificationPreferenceRequest request) {
    return ApiResponse.success(
        "Đã lưu tùy chọn thông báo", notificationService.updatePreferences(principal.id(), request));
  }

  @PostMapping("/reminders/appointment")
  public ApiResponse<NotificationResponse> appointment(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(
        "Đã tạo nhắc lịch tái khám", notificationService.createAppointmentReminder(principal.id()));
  }

  @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(@AuthenticationPrincipal AuraUserPrincipal principal) {
    return sseHub.subscribe(principal.id());
  }
}
