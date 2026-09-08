package com.aura.notification.service;

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
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationAdminService {

  private static final String DEFAULT_POLICY = "DEFAULT";
  private static final Set<String> CHANNELS = Set.of("EMAIL", "IN_APP", "SMS");

  private final NotificationTemplateRepository templateRepository;
  private final CommunicationPolicyRepository policyRepository;

  public NotificationAdminService(
      NotificationTemplateRepository templateRepository,
      CommunicationPolicyRepository policyRepository) {
    this.templateRepository = templateRepository;
    this.policyRepository = policyRepository;
  }

  @Transactional(readOnly = true)
  public List<NotificationTemplateDto> listTemplates() {
    return templateRepository.findAllByOrderByNameAsc().stream().map(this::toDto).toList();
  }

  @Transactional
  public NotificationTemplateDto createTemplate(UpsertNotificationTemplateRequest request) {
    String code = request.code().trim().toUpperCase();
    if (templateRepository.findByCodeIgnoreCase(code).isPresent()) {
      throw new IllegalArgumentException("Mã mẫu thông báo đã tồn tại: " + code);
    }
    NotificationTemplate template =
        new NotificationTemplate(
            code,
            request.name().trim(),
            normalizeChannel(request.channel()),
            request.subject().trim(),
            request.body());
    template.setDescription(request.description());
    template.setEnabled(request.enabled() == null || request.enabled());
    return toDto(templateRepository.save(template));
  }

  @Transactional
  public NotificationTemplateDto updateTemplate(UUID id, UpsertNotificationTemplateRequest request) {
    NotificationTemplate template =
        templateRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mẫu thông báo"));
    String code = request.code().trim().toUpperCase();
    if (templateRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
      throw new IllegalArgumentException("Mã mẫu thông báo đã tồn tại: " + code);
    }
    template.setCode(code);
    template.setName(request.name().trim());
    template.setChannel(normalizeChannel(request.channel()));
    template.setSubject(request.subject().trim());
    template.setBody(request.body());
    template.setDescription(request.description());
    if (request.enabled() != null) {
      template.setEnabled(request.enabled());
    }
    return toDto(templateRepository.save(template));
  }

  @Transactional
  public void deleteTemplate(UUID id) {
    if (!templateRepository.existsById(id)) {
      throw new ResourceNotFoundException("Không tìm thấy mẫu thông báo");
    }
    templateRepository.deleteById(id);
  }

  @Transactional(readOnly = true)
  public CommunicationPolicyDto getPolicy() {
    return toDto(requirePolicy());
  }

  @Transactional
  public CommunicationPolicyDto updatePolicy(UpdateCommunicationPolicyRequest request) {
    CommunicationPolicy policy = requirePolicy();
    if (request.emailEnabled() != null) policy.setEmailEnabled(request.emailEnabled());
    if (request.inAppEnabled() != null) policy.setInAppEnabled(request.inAppEnabled());
    if (request.smsEnabled() != null) policy.setSmsEnabled(request.smsEnabled());
    if (request.highRiskImmediate() != null) policy.setHighRiskImmediate(request.highRiskImmediate());
    if (request.marketingOptInDefault() != null) {
      policy.setMarketingOptInDefault(request.marketingOptInDefault());
    }
    if (request.quietHoursStart() != null) policy.setQuietHoursStart(request.quietHoursStart());
    if (request.quietHoursEnd() != null) policy.setQuietHoursEnd(request.quietHoursEnd());
    if (request.retentionDays() != null) policy.setRetentionDays(request.retentionDays());
    if (request.notes() != null) policy.setNotes(request.notes());
    return toDto(policyRepository.save(policy));
  }

  private CommunicationPolicy requirePolicy() {
    return policyRepository
        .findByPolicyKey(DEFAULT_POLICY)
        .orElseGet(() -> policyRepository.save(new CommunicationPolicy(DEFAULT_POLICY)));
  }

  private String normalizeChannel(String channel) {
    String value = channel.trim().toUpperCase().replace('-', '_');
    if (!CHANNELS.contains(value)) {
      throw new IllegalArgumentException("Kênh thông báo không hợp lệ. Dùng EMAIL, IN_APP hoặc SMS");
    }
    return value;
  }

  private NotificationTemplateDto toDto(NotificationTemplate t) {
    return new NotificationTemplateDto(
        t.getId(),
        t.getCode(),
        t.getName(),
        t.getChannel(),
        t.getSubject(),
        t.getBody(),
        t.getDescription(),
        t.isEnabled(),
        t.getUpdatedAt());
  }

  private CommunicationPolicyDto toDto(CommunicationPolicy p) {
    return new CommunicationPolicyDto(
        p.getId(),
        p.getPolicyKey(),
        p.isEmailEnabled(),
        p.isInAppEnabled(),
        p.isSmsEnabled(),
        p.isHighRiskImmediate(),
        p.isMarketingOptInDefault(),
        p.getQuietHoursStart(),
        p.getQuietHoursEnd(),
        p.getRetentionDays(),
        p.getNotes(),
        p.getUpdatedAt());
  }
}
