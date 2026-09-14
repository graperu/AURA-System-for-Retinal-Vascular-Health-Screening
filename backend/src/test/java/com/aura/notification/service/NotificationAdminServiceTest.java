package com.aura.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.notification.dto.CommunicationPolicyDto;
import com.aura.notification.dto.NotificationTemplateDto;
import com.aura.notification.dto.UpdateCommunicationPolicyRequest;
import com.aura.notification.dto.UpsertNotificationTemplateRequest;
import com.aura.notification.entity.CommunicationPolicy;
import com.aura.notification.entity.NotificationTemplate;
import com.aura.notification.repository.CommunicationPolicyRepository;
import com.aura.notification.repository.NotificationTemplateRepository;
import java.util.List;
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
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class NotificationAdminServiceTest {

  @Mock private NotificationTemplateRepository templateRepository;
  @Mock private CommunicationPolicyRepository policyRepository;

  @InjectMocks private NotificationAdminService adminService;

  private UUID templateId;
  private NotificationTemplate template;
  private CommunicationPolicy defaultPolicy;

  @BeforeEach
  void setUp() {
    templateId = UUID.randomUUID();
    template = new NotificationTemplate(
        "AI_ANALYSIS_COMPLETE",
        "Hoàn thành phân tích AI",
        "EMAIL",
        "Kết quả sàng lọc võng mạc của bạn đã sẵn sàng",
        "Kính gửi {{patientName}}, kết quả phân tích AI đã sẵn sàng."
    );
    ReflectionTestUtils.setField(template, "id", templateId);
    template.setDescription("Mẫu gửi khi AI hoàn tất phân tích ảnh");
    template.setEnabled(true);

    defaultPolicy = new CommunicationPolicy("DEFAULT");
    ReflectionTestUtils.setField(defaultPolicy, "id", UUID.randomUUID());
  }

  @Nested
  @DisplayName("listTemplates tests")
  class ListTemplatesTests {

    @Test
    @DisplayName("listTemplates returns list of template DTOs ordered by name")
    void listTemplates_ReturnsList() {
      // Arrange
      when(templateRepository.findAllByOrderByNameAsc()).thenReturn(List.of(template));

      // Act
      List<NotificationTemplateDto> result = adminService.listTemplates();

      // Assert
      assertThat(result).hasSize(1);
      assertThat(result.get(0).code()).isEqualTo("AI_ANALYSIS_COMPLETE");
      assertThat(result.get(0).channel()).isEqualTo("EMAIL");
    }
  }

  @Nested
  @DisplayName("createTemplate tests")
  class CreateTemplateTests {

    @Test
    @DisplayName("createTemplate normalizes channel and saves new template")
    void createTemplate_Success() {
      // Arrange
      var request = new UpsertNotificationTemplateRequest(
          "  dr_review_ready  ",
          "  Bác sĩ đã thẩm định  ",
          "  in-app  ",
          "Bác sĩ đã ký duyệt kết luận",
          "Nội dung thông báo",
          "Mô tả mẫu",
          true
      );
      when(templateRepository.findByCodeIgnoreCase("DR_REVIEW_READY")).thenReturn(Optional.empty());
      when(templateRepository.save(any(NotificationTemplate.class))).thenAnswer(i -> {
        NotificationTemplate t = i.getArgument(0);
        ReflectionTestUtils.setField(t, "id", UUID.randomUUID());
        return t;
      });

      // Act
      NotificationTemplateDto result = adminService.createTemplate(request);

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.code()).isEqualTo("DR_REVIEW_READY");
      assertThat(result.channel()).isEqualTo("IN_APP");
      assertThat(result.name()).isEqualTo("Bác sĩ đã thẩm định");
      verify(templateRepository).save(any(NotificationTemplate.class));
    }

    @Test
    @DisplayName("createTemplate throws IllegalArgumentException when code already exists")
    void createTemplate_DuplicateCode_ThrowsException() {
      // Arrange
      var request = new UpsertNotificationTemplateRequest(
          "AI_ANALYSIS_COMPLETE",
          "Tên mẫu",
          "EMAIL",
          "Tiêu đề",
          "Nội dung",
          null,
          true
      );
      when(templateRepository.findByCodeIgnoreCase("AI_ANALYSIS_COMPLETE")).thenReturn(Optional.of(template));

      // Act & Assert
      assertThatThrownBy(() -> adminService.createTemplate(request))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Mã mẫu thông báo đã tồn tại: AI_ANALYSIS_COMPLETE");
          });
      verify(templateRepository, never()).save(any());
    }

    @Test
    @DisplayName("createTemplate throws IllegalArgumentException when channel is invalid")
    void createTemplate_InvalidChannel_ThrowsException() {
      // Arrange
      var request = new UpsertNotificationTemplateRequest(
          "TELEGRAM_ALERT",
          "Telegram",
          "TELEGRAM",
          "Subject",
          "Body",
          null,
          true
      );
      when(templateRepository.findByCodeIgnoreCase("TELEGRAM_ALERT")).thenReturn(Optional.empty());

      // Act & Assert
      assertThatThrownBy(() -> adminService.createTemplate(request))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Kênh thông báo không hợp lệ");
          });
      verify(templateRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("updateTemplate tests")
  class UpdateTemplateTests {

    @Test
    @DisplayName("updateTemplate updates fields and saves template")
    void updateTemplate_Success() {
      // Arrange
      var request = new UpsertNotificationTemplateRequest(
          "AI_ANALYSIS_UPDATED",
          "Cập nhật phân tích AI",
          "SMS",
          "Tiêu đề mới",
          "Nội dung mới",
          "Mô tả mới",
          false
      );
      when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
      when(templateRepository.existsByCodeIgnoreCaseAndIdNot("AI_ANALYSIS_UPDATED", templateId)).thenReturn(false);
      when(templateRepository.save(template)).thenReturn(template);

      // Act
      NotificationTemplateDto result = adminService.updateTemplate(templateId, request);

      // Assert
      assertThat(result).isNotNull();
      assertThat(template.getCode()).isEqualTo("AI_ANALYSIS_UPDATED");
      assertThat(template.getChannel()).isEqualTo("SMS");
      assertThat(template.isEnabled()).isFalse();
      verify(templateRepository).save(template);
    }

    @Test
    @DisplayName("updateTemplate throws ResourceNotFoundException when template does not exist")
    void updateTemplate_NotFound_ThrowsException() {
      // Arrange
      UUID missingId = UUID.randomUUID();
      when(templateRepository.findById(missingId)).thenReturn(Optional.empty());

      var request = new UpsertNotificationTemplateRequest("CODE", "Name", "EMAIL", "Sub", "Body", null, true);

      // Act & Assert
      assertThatThrownBy(() -> adminService.updateTemplate(missingId, request))
          .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateTemplate throws IllegalArgumentException when code is used by another template")
    void updateTemplate_DuplicateCode_ThrowsException() {
      // Arrange
      var request = new UpsertNotificationTemplateRequest("EXISTING_CODE", "Name", "EMAIL", "Sub", "Body", null, true);
      when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
      when(templateRepository.existsByCodeIgnoreCaseAndIdNot("EXISTING_CODE", templateId)).thenReturn(true);

      // Act & Assert
      assertThatThrownBy(() -> adminService.updateTemplate(templateId, request))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Mã mẫu thông báo đã tồn tại: EXISTING_CODE");
          });
      verify(templateRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateTemplate throws IllegalArgumentException when channel is invalid")
    void updateTemplate_InvalidChannel_ThrowsException() {
      // Arrange
      var request = new UpsertNotificationTemplateRequest("VALID_CODE", "Name", "INVALID_CHAN", "Sub", "Body", null, true);
      when(templateRepository.findById(templateId)).thenReturn(Optional.of(template));
      when(templateRepository.existsByCodeIgnoreCaseAndIdNot("VALID_CODE", templateId)).thenReturn(false);

      // Act & Assert
      assertThatThrownBy(() -> adminService.updateTemplate(templateId, request))
          .isInstanceOfSatisfying(IllegalArgumentException.class, e -> {
            assertThat(e.getMessage()).contains("Kênh thông báo không hợp lệ");
          });
      verify(templateRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deleteTemplate tests")
  class DeleteTemplateTests {

    @Test
    @DisplayName("deleteTemplate deletes existing template")
    void deleteTemplate_Success() {
      // Arrange
      when(templateRepository.existsById(templateId)).thenReturn(true);

      // Act
      adminService.deleteTemplate(templateId);

      // Assert
      verify(templateRepository).deleteById(templateId);
    }

    @Test
    @DisplayName("deleteTemplate throws ResourceNotFoundException when template does not exist")
    void deleteTemplate_NotFound_ThrowsException() {
      // Arrange
      UUID missingId = UUID.randomUUID();
      when(templateRepository.existsById(missingId)).thenReturn(false);

      // Act & Assert
      assertThatThrownBy(() -> adminService.deleteTemplate(missingId))
          .isInstanceOf(ResourceNotFoundException.class);
      verify(templateRepository, never()).deleteById(any());
    }
  }

  @Nested
  @DisplayName("policy tests")
  class PolicyTests {

    @Test
    @DisplayName("getPolicy returns existing default policy")
    void getPolicy_ExistingPolicy_ReturnsDto() {
      // Arrange
      when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.of(defaultPolicy));

      // Act
      CommunicationPolicyDto result = adminService.getPolicy();

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.policyKey()).isEqualTo("DEFAULT");
      assertThat(result.emailEnabled()).isTrue();
    }

    @Test
    @DisplayName("getPolicy creates and returns default policy if not found in db")
    void getPolicy_NotFound_CreatesDefault() {
      // Arrange
      when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.empty());
      when(policyRepository.save(any(CommunicationPolicy.class))).thenAnswer(i -> {
        CommunicationPolicy p = i.getArgument(0);
        ReflectionTestUtils.setField(p, "id", UUID.randomUUID());
        return p;
      });

      // Act
      CommunicationPolicyDto result = adminService.getPolicy();

      // Assert
      assertThat(result).isNotNull();
      assertThat(result.policyKey()).isEqualTo("DEFAULT");
      verify(policyRepository).save(any(CommunicationPolicy.class));
    }

    @Test
    @DisplayName("updatePolicy updates all configured settings and saves")
    void updatePolicy_UpdatesConfiguredFields() {
      // Arrange
      when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.of(defaultPolicy));
      when(policyRepository.save(defaultPolicy)).thenReturn(defaultPolicy);

      var request = new UpdateCommunicationPolicyRequest(
          false,
          true,
          true,
          true,
          true,
          "22:00",
          "07:00",
          180,
          "Chính sách bảo lưu 6 tháng"
      );

      // Act
      CommunicationPolicyDto result = adminService.updatePolicy(request);

      // Assert
      assertThat(result).isNotNull();
      assertThat(defaultPolicy.isEmailEnabled()).isFalse();
      assertThat(defaultPolicy.isInAppEnabled()).isTrue();
      assertThat(defaultPolicy.isSmsEnabled()).isTrue();
      assertThat(defaultPolicy.isHighRiskImmediate()).isTrue();
      assertThat(defaultPolicy.isMarketingOptInDefault()).isTrue();
      assertThat(defaultPolicy.getQuietHoursStart()).isEqualTo("22:00");
      assertThat(defaultPolicy.getQuietHoursEnd()).isEqualTo("07:00");
      assertThat(defaultPolicy.getRetentionDays()).isEqualTo(180);
      assertThat(defaultPolicy.getNotes()).isEqualTo("Chính sách bảo lưu 6 tháng");
      verify(policyRepository).save(defaultPolicy);
    }
  }
}
