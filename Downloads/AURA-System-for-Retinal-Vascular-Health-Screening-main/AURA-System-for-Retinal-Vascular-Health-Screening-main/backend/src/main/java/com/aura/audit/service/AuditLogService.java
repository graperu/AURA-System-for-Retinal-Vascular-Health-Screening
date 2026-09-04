package com.aura.audit.service;

import com.aura.audit.dto.AuditLogDto;
import com.aura.audit.entity.AuditLog;
import com.aura.audit.repository.AuditLogRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

  private final AuditLogRepository auditLogRepository;

  public AuditLogService(AuditLogRepository auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  @Transactional
  public AuditLog logEvent(
      UUID userId,
      String userEmail,
      String action,
      String resourceType,
      String resourceId,
      String ipAddress,
      String userAgent,
      String status,
      String details) {
    AuditLog log =
        new AuditLog(
            userId,
            userEmail,
            action,
            resourceType,
            resourceId,
            ipAddress,
            userAgent,
            status,
            details);
    return auditLogRepository.save(log);
  }

  @Transactional(readOnly = true)
  public Page<AuditLogDto> getAllLogs(Pageable pageable) {
    return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(AuditLogDto::fromEntity);
  }

  @Transactional(readOnly = true)
  public List<AuditLogDto> getExportableLogs() {
    return auditLogRepository.findTop1000ByOrderByCreatedAtDesc().stream()
        .map(AuditLogDto::fromEntity)
        .toList();
  }
}
