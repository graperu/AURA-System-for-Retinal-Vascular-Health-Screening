package com.aura.notification.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.ErrorCode;
import com.aura.notification.dto.CommunicationPolicyDto;
import com.aura.notification.dto.NotificationTemplateDto;
import com.aura.notification.dto.UpdateCommunicationPolicyRequest;
import com.aura.notification.dto.UpsertNotificationTemplateRequest;
import com.aura.notification.service.NotificationAdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AdminNotificationControllerTest {

  @Mock
  private NotificationAdminService notificationAdminService;

  @InjectMocks
  private AdminNotificationController controller;

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  private UUID sampleTemplateId;
  private NotificationTemplateDto sampleTemplateDto;
  private CommunicationPolicyDto samplePolicyDto;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();
    objectMapper = new ObjectMapper();

    sampleTemplateId = UUID.randomUUID();
    sampleTemplateDto = new NotificationTemplateDto(
        sampleTemplateId,
        "SCREENING_READY",
        "Kết quả sàng lọc sẵn sàng",
        "EMAIL",
        "Kết quả phân tích AURA của bạn đã có",
        "<p>Chào bệnh nhân, kết quả của bạn đã sẵn sàng.</p>",
        "Gửi khi AI hoàn tất phân tích hình ảnh",
        true,
        Instant.now()
    );

    samplePolicyDto = new CommunicationPolicyDto(
        UUID.randomUUID(),
        "DEFAULT",
        true,
        true,
        false,
        true,
        true,
        "22:00",
        "07:00",
        90,
        "Chính sách mặc định",
        Instant.now()
    );
  }

  @Nested
  @DisplayName("GET /api/v1/admin/notification-templates - Danh sách mẫu thông báo")
  class ListTemplatesTests {

    @Test
    @DisplayName("Lấy danh sách mẫu thông báo thành công -> HTTP 200")
    void listTemplates_success() throws Exception {
      when(notificationAdminService.listTemplates()).thenReturn(List.of(sampleTemplateDto));

      mockMvc.perform(get("/api/v1/admin/notification-templates"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].code").value("SCREENING_READY"))
          .andExpect(jsonPath("$.data[0].name").value("Kết quả sàng lọc sẵn sàng"));

      verify(notificationAdminService).listTemplates();
    }

    @Test
    @DisplayName("Lấy danh sách khi chưa có mẫu nào -> HTTP 200, danh sách rỗng")
    void listTemplates_emptyList() throws Exception {
      when(notificationAdminService.listTemplates()).thenReturn(List.of());

      mockMvc.perform(get("/api/v1/admin/notification-templates"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data").isEmpty());

      verify(notificationAdminService).listTemplates();
    }
  }

  @Nested
  @DisplayName("POST /api/v1/admin/notification-templates - Tạo mẫu thông báo mới")
  class CreateTemplateTests {

    @Test
    @DisplayName("Tạo mẫu thông báo thành công -> HTTP 200/201")
    void createTemplate_success() throws Exception {
      UpsertNotificationTemplateRequest request = new UpsertNotificationTemplateRequest(
          "NEW_APPOINTMENT",
          "Lịch hẹn khám mới",
          "EMAIL",
          "Xác nhận lịch hẹn",
          "Nội dung email",
          "Mô tả mẫu",
          true
      );
      when(notificationAdminService.createTemplate(any(UpsertNotificationTemplateRequest.class)))
          .thenReturn(sampleTemplateDto);

      mockMvc.perform(post("/api/v1/admin/notification-templates")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.code").value("SCREENING_READY"));

      verify(notificationAdminService).createTemplate(any(UpsertNotificationTemplateRequest.class));
    }

    @Test
    @DisplayName("Tạo mẫu thất bại do thiếu trường bắt buộc -> HTTP 400 VALIDATION_ERROR")
    void createTemplate_validationError() throws Exception {
      UpsertNotificationTemplateRequest invalidRequest = new UpsertNotificationTemplateRequest(
          "", "", "", "", "", null, null
      );

      mockMvc.perform(post("/api/v1/admin/notification-templates")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(invalidRequest)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Nested
  @DisplayName("PUT /api/v1/admin/notification-templates/{id} - Cập nhật mẫu thông báo")
  class UpdateTemplateTests {

    @Test
    @DisplayName("Cập nhật mẫu thông báo thành công -> HTTP 200")
    void updateTemplate_success() throws Exception {
      UpsertNotificationTemplateRequest request = new UpsertNotificationTemplateRequest(
          "SCREENING_READY_V2",
          "Kết quả cập nhật",
          "IN_APP",
          "Tiêu đề mới",
          "Nội dung mới",
          "Mô tả cập nhật",
          true
      );
      when(notificationAdminService.updateTemplate(eq(sampleTemplateId), any(UpsertNotificationTemplateRequest.class)))
          .thenReturn(sampleTemplateDto);

      mockMvc.perform(put("/api/v1/admin/notification-templates/{id}", sampleTemplateId)
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true));

      verify(notificationAdminService).updateTemplate(eq(sampleTemplateId), any(UpsertNotificationTemplateRequest.class));
    }

    @Test
    @DisplayName("Cập nhật mẫu không tồn tại -> HTTP 404 RESOURCE_NOT_FOUND")
    void updateTemplate_notFound() throws Exception {
      UUID nonExistentId = UUID.randomUUID();
      UpsertNotificationTemplateRequest request = new UpsertNotificationTemplateRequest(
          "CODE", "Name", "EMAIL", "Subject", "Body", null, true
      );
      when(notificationAdminService.updateTemplate(eq(nonExistentId), any(UpsertNotificationTemplateRequest.class)))
          .thenThrow(new ResourceNotFoundException("Không tìm thấy mẫu thông báo"));

      mockMvc.perform(put("/api/v1/admin/notification-templates/{id}", nonExistentId)
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.code").value(ErrorCode.RESOURCE_NOT_FOUND.name()));
    }
  }

  @Nested
  @DisplayName("DELETE /api/v1/admin/notification-templates/{id} - Xóa mẫu thông báo")
  class DeleteTemplateTests {

    @Test
    @DisplayName("Xóa mẫu thông báo thành công -> HTTP 200")
    void deleteTemplate_success() throws Exception {
      doNothing().when(notificationAdminService).deleteTemplate(sampleTemplateId);

      mockMvc.perform(delete("/api/v1/admin/notification-templates/{id}", sampleTemplateId))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.message").value("Đã xóa mẫu thông báo"));

      verify(notificationAdminService).deleteTemplate(sampleTemplateId);
    }

    @Test
    @DisplayName("Xóa mẫu không tồn tại -> HTTP 404 RESOURCE_NOT_FOUND")
    void deleteTemplate_notFound() throws Exception {
      UUID nonExistentId = UUID.randomUUID();
      doThrow(new ResourceNotFoundException("Không tìm thấy mẫu thông báo"))
          .when(notificationAdminService).deleteTemplate(nonExistentId);

      mockMvc.perform(delete("/api/v1/admin/notification-templates/{id}", nonExistentId))
          .andExpect(status().isNotFound())
          .andExpect(jsonPath("$.code").value(ErrorCode.RESOURCE_NOT_FOUND.name()));
    }
  }

  @Nested
  @DisplayName("GET & PUT /api/v1/admin/communication-policy - Chính sách liên lạc")
  class CommunicationPolicyTests {

    @Test
    @DisplayName("Lấy chính sách liên lạc toàn cục thành công -> HTTP 200")
    void getPolicy_success() throws Exception {
      when(notificationAdminService.getPolicy()).thenReturn(samplePolicyDto);

      mockMvc.perform(get("/api/v1/admin/communication-policy"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.policyKey").value("DEFAULT"))
          .andExpect(jsonPath("$.data.emailEnabled").value(true))
          .andExpect(jsonPath("$.data.retentionDays").value(90));

      verify(notificationAdminService).getPolicy();
    }

    @Test
    @DisplayName("Cập nhật chính sách liên lạc thành công -> HTTP 200")
    void updatePolicy_success() throws Exception {
      UpdateCommunicationPolicyRequest request = new UpdateCommunicationPolicyRequest(
          true, true, true, true, false, "23:00", "06:00", 180, "Ghi chú cập nhật"
      );
      when(notificationAdminService.updatePolicy(any(UpdateCommunicationPolicyRequest.class)))
          .thenReturn(samplePolicyDto);

      mockMvc.perform(put("/api/v1/admin/communication-policy")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.message").value("Đã lưu chính sách liên lạc"));

      verify(notificationAdminService).updatePolicy(any(UpdateCommunicationPolicyRequest.class));
    }

    @Test
    @DisplayName("Cập nhật chính sách liên lạc thất bại do retentionDays vượt ngoài biên (30 - 2555) -> HTTP 400")
    void updatePolicy_validationError_retentionDaysOutOfRange() throws Exception {
      UpdateCommunicationPolicyRequest request = new UpdateCommunicationPolicyRequest(
          true, true, true, true, false, "23:00", "06:00", 10, "Quá thấp"
      );

      mockMvc.perform(put("/api/v1/admin/communication-policy")
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.code").value(ErrorCode.VALIDATION_ERROR.name()));
    }
  }

  @Test
  @DisplayName("Direct method test: getTemplates & getTemplateById mô phỏng")
  void directMethodCoverage_test() {
    when(notificationAdminService.listTemplates()).thenReturn(List.of(sampleTemplateDto));
    ApiResponse<List<NotificationTemplateDto>> response = controller.listTemplates();
    assertThat(response.data()).hasSize(1);
    assertThat(response.data().get(0).id()).isEqualTo(sampleTemplateId);
  }
}
