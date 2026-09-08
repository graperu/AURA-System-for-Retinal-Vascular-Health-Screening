package com.aura.notification.controller;

import com.aura.common.response.ApiResponse;
import com.aura.notification.dto.CommunicationPolicyDto;
import com.aura.notification.dto.NotificationTemplateDto;
import com.aura.notification.dto.UpdateCommunicationPolicyRequest;
import com.aura.notification.dto.UpsertNotificationTemplateRequest;
import com.aura.notification.service.NotificationAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin Notifications", description = "Mẫu thông báo và chính sách liên lạc (FR-39)")
public class AdminNotificationController {

  private final NotificationAdminService notificationAdminService;

  public AdminNotificationController(NotificationAdminService notificationAdminService) {
    this.notificationAdminService = notificationAdminService;
  }

  @GetMapping("/notification-templates")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "List notification templates")
  public ApiResponse<List<NotificationTemplateDto>> listTemplates() {
    return ApiResponse.success(
        "Lấy danh sách mẫu thông báo thành công", notificationAdminService.listTemplates());
  }

  @PostMapping("/notification-templates")
  @PreAuthorize("hasRole('ADMIN')")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Create a notification template")
  public ApiResponse<NotificationTemplateDto> createTemplate(
      @Valid @RequestBody UpsertNotificationTemplateRequest request) {
    return ApiResponse.success("Đã tạo mẫu thông báo", notificationAdminService.createTemplate(request));
  }

  @PutMapping("/notification-templates/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Update a notification template")
  public ApiResponse<NotificationTemplateDto> updateTemplate(
      @PathVariable UUID id, @Valid @RequestBody UpsertNotificationTemplateRequest request) {
    return ApiResponse.success("Đã cập nhật mẫu thông báo", notificationAdminService.updateTemplate(id, request));
  }

  @DeleteMapping("/notification-templates/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Delete a notification template")
  public ApiResponse<Void> deleteTemplate(@PathVariable UUID id) {
    notificationAdminService.deleteTemplate(id);
    return ApiResponse.success("Đã xóa mẫu thông báo", null);
  }

  @GetMapping("/communication-policy")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Get the global communication policy")
  public ApiResponse<CommunicationPolicyDto> getPolicy() {
    return ApiResponse.success("Lấy chính sách liên lạc thành công", notificationAdminService.getPolicy());
  }

  @PutMapping("/communication-policy")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Update the global communication policy")
  public ApiResponse<CommunicationPolicyDto> updatePolicy(
      @Valid @RequestBody UpdateCommunicationPolicyRequest request) {
    return ApiResponse.success("Đã lưu chính sách liên lạc", notificationAdminService.updatePolicy(request));
  }
}
