package com.aura.notification.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import com.aura.notification.dto.UserNotificationDto;
import com.aura.notification.service.UserNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "User Notifications & SSE", description = "Endpoints cho thông báo thời gian thực và SSE (FR-9)")
public class UserNotificationController {

  private final UserNotificationService userNotificationService;

  public UserNotificationController(UserNotificationService userNotificationService) {
    this.userNotificationService = userNotificationService;
  }

  @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  @Operation(summary = "SSE stream nhận thông báo tức thời khi có kết quả AI hoặc tin nhắn (FR-9)")
  public SseEmitter streamNotifications(@AuthenticationPrincipal AuraUserPrincipal principal) {
    return userNotificationService.subscribe(principal.id());
  }

  @GetMapping
  @Operation(summary = "Lấy danh sách thông báo của người dùng hiện tại")
  public ApiResponse<List<UserNotificationDto>> getNotifications(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    return ApiResponse.success(
        "Lấy danh sách thông báo thành công",
        userNotificationService.getUserNotifications(principal.id()));
  }

  @GetMapping("/paged")
  @Operation(summary = "Lấy danh sách thông báo phân trang")
  public ApiResponse<PageResponse<UserNotificationDto>> getNotificationsPaged(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    return ApiResponse.success(
        PageResponse.from(
            userNotificationService.getUserNotificationsPaged(principal.id(), pageable)));
  }

  @GetMapping("/unread-count")
  @Operation(summary = "Lấy số lượng thông báo chưa đọc")
  public ApiResponse<Map<String, Long>> getUnreadCount(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    long count = userNotificationService.getUnreadCount(principal.id());
    return ApiResponse.success(Map.of("unreadCount", count));
  }

  @PutMapping("/{id}/read")
  @Operation(summary = "Đánh dấu một thông báo đã đọc")
  public ApiResponse<UserNotificationDto> markAsRead(
      @AuthenticationPrincipal AuraUserPrincipal principal, @PathVariable UUID id) {
    return ApiResponse.success(
        "Đã đánh dấu đã đọc", userNotificationService.markAsRead(principal.id(), id));
  }

  @PutMapping("/read-all")
  @Operation(summary = "Đánh dấu tất cả thông báo đã đọc")
  public ApiResponse<Void> markAllAsRead(@AuthenticationPrincipal AuraUserPrincipal principal) {
    userNotificationService.markAllAsRead(principal.id());
    return ApiResponse.success("Đã đánh dấu tất cả thông báo đã đọc", null);
  }
}
