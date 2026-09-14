package com.aura.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.notification.dto.CommunicationPolicyDto;
import com.aura.notification.dto.UpdateCommunicationPolicyRequest;
import com.aura.notification.entity.CommunicationPolicy;
import com.aura.notification.repository.CommunicationPolicyRepository;
import com.aura.notification.repository.NotificationTemplateRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationAdminService - Optimized Single Field Policy Update Tests")
class NotificationAdminServiceOptimizedTest {

  @Mock private NotificationTemplateRepository templateRepository;
  @Mock private CommunicationPolicyRepository policyRepository;

  private NotificationAdminService adminService;
  private CommunicationPolicy basePolicy;

  @BeforeEach
  void setUp() {
    adminService = new NotificationAdminService(templateRepository, policyRepository);

    basePolicy = new CommunicationPolicy("DEFAULT");
    ReflectionTestUtils.setField(basePolicy, "id", UUID.randomUUID());
    basePolicy.setEmailEnabled(true);
    basePolicy.setInAppEnabled(true);
    basePolicy.setSmsEnabled(false);
    basePolicy.setHighRiskImmediate(true);
    basePolicy.setMarketingOptInDefault(false);
    basePolicy.setQuietHoursStart("21:00");
    basePolicy.setQuietHoursEnd("06:00");
    basePolicy.setRetentionDays(365);
    basePolicy.setNotes("Initial Policy");
  }

  @Test
  @DisplayName("updatePolicy: Giữ nguyên toàn bộ giá trị cũ khi tất cả các trường trong request đều null")
  void testUpdatePolicyAllFieldsNull() {
    when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.of(basePolicy));
    when(policyRepository.save(any(CommunicationPolicy.class))).thenAnswer(i -> i.getArgument(0));

    UpdateCommunicationPolicyRequest emptyRequest =
        new UpdateCommunicationPolicyRequest(null, null, null, null, null, null, null, null, null);

    CommunicationPolicyDto result = adminService.updatePolicy(emptyRequest);

    assertThat(result.emailEnabled()).isTrue();
    assertThat(result.inAppEnabled()).isTrue();
    assertThat(result.smsEnabled()).isFalse();
    assertThat(result.highRiskImmediate()).isTrue();
    assertThat(result.marketingOptInDefault()).isFalse();
    assertThat(result.quietHoursStart()).isEqualTo("21:00");
    assertThat(result.quietHoursEnd()).isEqualTo("06:00");
    assertThat(result.retentionDays()).isEqualTo(365);
    assertThat(result.notes()).isEqualTo("Initial Policy");
  }

  @ParameterizedTest(name = "Field {0}: from {1} to {2}")
  @CsvSource({
    "emailEnabled, true, false",
    "inAppEnabled, true, false",
    "smsEnabled, false, true",
    "highRiskImmediate, true, false",
    "marketingOptInDefault, false, true"
  })
  @DisplayName("updatePolicy: Cập nhật từng trường boolean đơn lẻ mà không làm ảnh hưởng các trường khác")
  void testUpdateSingleBooleanField(String fieldName, boolean originalVal, boolean newVal) {
    when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.of(basePolicy));
    when(policyRepository.save(any(CommunicationPolicy.class))).thenAnswer(i -> i.getArgument(0));

    UpdateCommunicationPolicyRequest request = switch (fieldName) {
      case "emailEnabled" -> new UpdateCommunicationPolicyRequest(newVal, null, null, null, null, null, null, null, null);
      case "inAppEnabled" -> new UpdateCommunicationPolicyRequest(null, newVal, null, null, null, null, null, null, null);
      case "smsEnabled" -> new UpdateCommunicationPolicyRequest(null, null, newVal, null, null, null, null, null, null);
      case "highRiskImmediate" -> new UpdateCommunicationPolicyRequest(null, null, null, newVal, null, null, null, null, null);
      case "marketingOptInDefault" -> new UpdateCommunicationPolicyRequest(null, null, null, null, newVal, null, null, null, null);
      default -> throw new IllegalArgumentException("Unknown field: " + fieldName);
    };

    CommunicationPolicyDto result = adminService.updatePolicy(request);

    ArgumentCaptor<CommunicationPolicy> captor = ArgumentCaptor.forClass(CommunicationPolicy.class);
    verify(policyRepository).save(captor.capture());
    CommunicationPolicy saved = captor.getValue();

    switch (fieldName) {
      case "emailEnabled" -> assertThat(saved.isEmailEnabled()).isEqualTo(newVal);
      case "inAppEnabled" -> assertThat(saved.isInAppEnabled()).isEqualTo(newVal);
      case "smsEnabled" -> assertThat(saved.isSmsEnabled()).isEqualTo(newVal);
      case "highRiskImmediate" -> assertThat(saved.isHighRiskImmediate()).isEqualTo(newVal);
      case "marketingOptInDefault" -> assertThat(saved.isMarketingOptInDefault()).isEqualTo(newVal);
    }

    // Các trường khác không đổi
    assertThat(saved.getRetentionDays()).isEqualTo(365);
    assertThat(saved.getNotes()).isEqualTo("Initial Policy");
  }

  @Test
  @DisplayName("updatePolicy: Cập nhật các trường quietHours, retentionDays và notes riêng lẻ")
  void testUpdateQuietHoursAndRetentionAndNotesIndividually() {
    when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.of(basePolicy));
    when(policyRepository.save(any(CommunicationPolicy.class))).thenAnswer(i -> i.getArgument(0));

    // 1. Cập nhật quietHoursStart
    adminService.updatePolicy(new UpdateCommunicationPolicyRequest(null, null, null, null, null, "23:00", null, null, null));
    assertThat(basePolicy.getQuietHoursStart()).isEqualTo("23:00");
    assertThat(basePolicy.getQuietHoursEnd()).isEqualTo("06:00");

    // 2. Cập nhật quietHoursEnd
    adminService.updatePolicy(new UpdateCommunicationPolicyRequest(null, null, null, null, null, null, "08:00", null, null));
    assertThat(basePolicy.getQuietHoursEnd()).isEqualTo("08:00");

    // 3. Cập nhật retentionDays
    adminService.updatePolicy(new UpdateCommunicationPolicyRequest(null, null, null, null, null, null, null, 730, null));
    assertThat(basePolicy.getRetentionDays()).isEqualTo(730);

    // 4. Cập nhật notes
    adminService.updatePolicy(new UpdateCommunicationPolicyRequest(null, null, null, null, null, null, null, null, "Updated Retention Policy"));
    assertThat(basePolicy.getNotes()).isEqualTo("Updated Retention Policy");
  }

  @Test
  @DisplayName("updatePolicy: Tự động khởi tạo policy mặc định nếu chưa tồn tại trong cơ sở dữ liệu")
  void testCreatePolicyWhenNotExisting() {
    when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.empty());
    when(policyRepository.save(any(CommunicationPolicy.class))).thenAnswer(i -> i.getArgument(0));

    UpdateCommunicationPolicyRequest request =
        new UpdateCommunicationPolicyRequest(true, true, true, false, false, "22:00", "07:00", 180, "New Init");

    CommunicationPolicyDto result = adminService.updatePolicy(request);

    assertThat(result).isNotNull();
    assertThat(result.smsEnabled()).isTrue();
    assertThat(result.retentionDays()).isEqualTo(180);
    assertThat(result.notes()).isEqualTo("New Init");
  }

  @Test
  @DisplayName("createTemplate: Xử lý các giá trị enabled (null, false, true), chuẩn hóa channel và chặn mã trùng")
  void testCreateTemplateEnabledAndChannelValidation() {
    // 1. Mã đã tồn tại -> ném ngoại lệ
    when(templateRepository.findByCodeIgnoreCase("DUP_CODE")).thenReturn(Optional.of(mock(com.aura.notification.entity.NotificationTemplate.class)));
    var dupReq = new com.aura.notification.dto.UpsertNotificationTemplateRequest("DUP_CODE", "Name", "EMAIL", "Sub", "Body", "Desc", true);
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> adminService.createTemplate(dupReq))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Mã mẫu thông báo đã tồn tại");

    // 2. Kênh không hợp lệ -> ném ngoại lệ
    when(templateRepository.findByCodeIgnoreCase("NEW_CODE")).thenReturn(Optional.empty());
    var invalidChannelReq = new com.aura.notification.dto.UpsertNotificationTemplateRequest("NEW_CODE", "Name", "TELEGRAM", "Sub", "Body", "Desc", true);
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> adminService.createTemplate(invalidChannelReq))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Kênh thông báo không hợp lệ");

    // 3. enabled = null -> mặc định là true
    when(templateRepository.save(any(com.aura.notification.entity.NotificationTemplate.class))).thenAnswer(i -> i.getArgument(0));
    var nullEnabledReq = new com.aura.notification.dto.UpsertNotificationTemplateRequest("TPL_NULL", "Name", "in-app", "Sub", "Body", "Desc", null);
    var dtoNull = adminService.createTemplate(nullEnabledReq);
    assertThat(dtoNull.enabled()).isTrue();
    assertThat(dtoNull.channel()).isEqualTo("IN_APP");

    // 4. enabled = false -> gán đúng false
    var falseEnabledReq = new com.aura.notification.dto.UpsertNotificationTemplateRequest("TPL_FALSE", "Name", "sms", "Sub", "Body", "Desc", false);
    var dtoFalse = adminService.createTemplate(falseEnabledReq);
    assertThat(dtoFalse.enabled()).isFalse();
    assertThat(dtoFalse.channel()).isEqualTo("SMS");
  }

  @Test
  @DisplayName("updateTemplate: Cập nhật template, kiểm tra enabled null vs false vs true và chặn trùng code")
  void testUpdateTemplateEnabledAndValidation() {
    UUID tplId = UUID.randomUUID();
    var existingTpl = new com.aura.notification.entity.NotificationTemplate("OLD_CODE", "Old Name", "EMAIL", "Old Sub", "Old Body");
    existingTpl.setEnabled(true);
    ReflectionTestUtils.setField(existingTpl, "id", tplId);

    // 1. Không tìm thấy template -> ném ResourceNotFoundException
    when(templateRepository.findById(tplId)).thenReturn(Optional.empty());
    var updateReq = new com.aura.notification.dto.UpsertNotificationTemplateRequest("CODE", "Name", "EMAIL", "Sub", "Body", "Desc", true);
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> adminService.updateTemplate(tplId, updateReq))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);

    // 2. Mã code bị trùng với template khác
    when(templateRepository.findById(tplId)).thenReturn(Optional.of(existingTpl));
    when(templateRepository.existsByCodeIgnoreCaseAndIdNot("DUP_CODE", tplId)).thenReturn(true);
    var dupUpdateReq = new com.aura.notification.dto.UpsertNotificationTemplateRequest("DUP_CODE", "Name", "EMAIL", "Sub", "Body", "Desc", true);
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> adminService.updateTemplate(tplId, dupUpdateReq))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Mã mẫu thông báo đã tồn tại");

    // 3. enabled = null -> giữ nguyên giá trị cũ (true)
    when(templateRepository.existsByCodeIgnoreCaseAndIdNot("UPDATED_CODE", tplId)).thenReturn(false);
    when(templateRepository.save(any(com.aura.notification.entity.NotificationTemplate.class))).thenAnswer(i -> i.getArgument(0));
    var nullEnabledUpdate = new com.aura.notification.dto.UpsertNotificationTemplateRequest("UPDATED_CODE", "New Name", "EMAIL", "New Sub", "New Body", "Desc", null);
    var dtoNull = adminService.updateTemplate(tplId, nullEnabledUpdate);
    assertThat(dtoNull.enabled()).isTrue();

    // 4. enabled = false -> đổi sang false
    var falseEnabledUpdate = new com.aura.notification.dto.UpsertNotificationTemplateRequest("UPDATED_CODE", "New Name", "EMAIL", "New Sub", "New Body", "Desc", false);
    var dtoFalse = adminService.updateTemplate(tplId, falseEnabledUpdate);
    assertThat(dtoFalse.enabled()).isFalse();
  }

  @Test
  @DisplayName("deleteTemplate & listTemplates: Quản trị template CRUD hoàn chỉnh")
  void testDeleteAndListTemplates() {
    UUID tplId = UUID.randomUUID();

    // 1. deleteTemplate không tìm thấy -> ném lỗi
    when(templateRepository.existsById(tplId)).thenReturn(false);
    org.assertj.core.api.Assertions.assertThatThrownBy(() -> adminService.deleteTemplate(tplId))
        .isInstanceOf(com.aura.common.exception.ResourceNotFoundException.class);

    // 2. deleteTemplate thành công
    when(templateRepository.existsById(tplId)).thenReturn(true);
    adminService.deleteTemplate(tplId);
    verify(templateRepository).deleteById(tplId);

    // 3. listTemplates
    when(templateRepository.findAllByOrderByNameAsc()).thenReturn(java.util.List.of());
    var list = adminService.listTemplates();
    assertThat(list).isEmpty();

    // 4. getPolicy
    when(policyRepository.findByPolicyKey("DEFAULT")).thenReturn(Optional.of(basePolicy));
    var policy = adminService.getPolicy();
    assertThat(policy).isNotNull();
  }
}
