package com.aura.audit.controller;

import com.aura.audit.dto.AuditLogDto;
import com.aura.audit.service.AuditLogService;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@Tag(name = "Admin Audit Logs", description = "Endpoints for security audit logs and compliance (FR-37, NFR-18)")
public class AdminAuditController {

  private final AuditLogService auditLogService;

  public AdminAuditController(AuditLogService auditLogService) {
    this.auditLogService = auditLogService;
  }

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Get paginated audit logs")
  public ApiResponse<PageResponse<AuditLogDto>> getAuditLogs(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<AuditLogDto> logPage = auditLogService.getAllLogs(pageable);
    return ApiResponse.success(PageResponse.from(logPage));
  }

  @GetMapping("/export")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Export top audit logs for compliance")
  public ApiResponse<List<AuditLogDto>> exportAuditLogs() {
    return ApiResponse.success(auditLogService.getExportableLogs());
  }
}
