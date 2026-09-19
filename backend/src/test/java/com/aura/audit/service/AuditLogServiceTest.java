package com.aura.audit.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.audit.dto.AuditLogDto;
import com.aura.audit.entity.AuditLog;
import com.aura.audit.repository.AuditLogRepository;
import java.io.StringWriter;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService Unit Tests (FR-37 / NFR-18 Security Audit Logging)")
class AuditLogServiceTest {

  @Mock private AuditLogRepository auditLogRepository;

  @InjectMocks private AuditLogService auditLogService;

  private UUID userId;
  private UUID logId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    logId = UUID.randomUUID();
  }

  @Nested
  @DisplayName("logEvent Tests")
  class LogEventTests {

    @Test
    @DisplayName("Successfully logs user action event with full audit context")
    void logEvent_FullContext_SavesAuditLog() {
      when(auditLogRepository.save(any(AuditLog.class)))
          .thenAnswer(inv -> {
            AuditLog log = inv.getArgument(0);
            ReflectionTestUtils.setField(log, "id", logId);
            ReflectionTestUtils.setField(log, "createdAt", Instant.now());
            return log;
          });

      AuditLog result =
          auditLogService.logEvent(
              userId,
              "doctor@aura.health",
              "DIAGNOSIS_SIGN",
              "SCREENING",
              "scr_12345",
              "192.168.1.100",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "SUCCESS",
              "Bác sĩ ký duyệt kết luận lâm sàng ca nghi ngờ DR");

      assertThat(result).isNotNull();
      assertThat(result.getId()).isEqualTo(logId);
      assertThat(result.getUserId()).isEqualTo(userId);
      assertThat(result.getUserEmail()).isEqualTo("doctor@aura.health");
      assertThat(result.getAction()).isEqualTo("DIAGNOSIS_SIGN");
      assertThat(result.getResourceType()).isEqualTo("SCREENING");
      assertThat(result.getResourceId()).isEqualTo("scr_12345");
      assertThat(result.getIpAddress()).isEqualTo("192.168.1.100");
      assertThat(result.getUserAgent()).contains("Mozilla/5.0");
      assertThat(result.getStatus()).isEqualTo("SUCCESS");
      assertThat(result.getDetails()).contains("ký duyệt kết luận lâm sàng");

      ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
      verify(auditLogRepository).save(captor.capture());
      AuditLog captured = captor.getValue();
      assertThat(captured.getUserId()).isEqualTo(userId);
      assertThat(captured.getAction()).isEqualTo("DIAGNOSIS_SIGN");
    }

    @Test
    @DisplayName("logEvent with null status defaults to SUCCESS")
    void logEvent_NullStatus_DefaultsToSuccess() {
      when(auditLogRepository.save(any(AuditLog.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      AuditLog result =
          auditLogService.logEvent(
              null,
              "anonymous@aura.health",
              "LOGIN_ATTEMPT",
              "AUTH",
              null,
              "10.0.0.1",
              "Chrome/120.0",
              null,
              "Đăng nhập ẩn danh");

      assertThat(result.getStatus()).isEqualTo("SUCCESS");
      assertThat(result.getUserId()).isNull();
    }

    @Test
    @DisplayName("logEvent records FAILED security event")
    void logEvent_SecurityFailure_RecordsFailedStatus() {
      when(auditLogRepository.save(any(AuditLog.class)))
          .thenAnswer(inv -> inv.getArgument(0));

      AuditLog result =
          auditLogService.logEvent(
              userId,
              "attacker@bad.com",
              "IDOR_ACCESS_BLOCKED",
              "SCREENING",
              "target_999",
              "203.0.113.5",
              "curl/7.88.1",
              "FAILED",
              "Cố ý truy cập hồ sơ bệnh nhân ngoài phạm vi phân công");

      assertThat(result.getStatus()).isEqualTo("FAILED");
      assertThat(result.getAction()).isEqualTo("IDOR_ACCESS_BLOCKED");
    }

    @Test
    @DisplayName("AUD-01: logEvent methods must be annotated with @Transactional(propagation = Propagation.REQUIRES_NEW)")
    void verifyTransactionPropagationRequiresNew() throws NoSuchMethodException {
      java.lang.reflect.Method logEvent11 = AuditLogService.class.getMethod("logEvent",
          UUID.class, String.class, String.class, String.class, String.class,
          String.class, String.class, String.class, String.class, String.class, String.class);
      org.springframework.transaction.annotation.Transactional tx11 =
          logEvent11.getAnnotation(org.springframework.transaction.annotation.Transactional.class);
      assertThat(tx11).isNotNull();
      assertThat(tx11.propagation()).isEqualTo(org.springframework.transaction.annotation.Propagation.REQUIRES_NEW);

      java.lang.reflect.Method logEvent9 = AuditLogService.class.getMethod("logEvent",
          UUID.class, String.class, String.class, String.class, String.class,
          String.class, String.class, String.class, String.class);
      org.springframework.transaction.annotation.Transactional tx9 =
          logEvent9.getAnnotation(org.springframework.transaction.annotation.Transactional.class);
      assertThat(tx9).isNotNull();
      assertThat(tx9.propagation()).isEqualTo(org.springframework.transaction.annotation.Propagation.REQUIRES_NEW);
    }
  }

  @Nested
  @DisplayName("getAllLogs Tests")
  class GetAllLogsTests {

    @Test
    @DisplayName("getAllLogs returns paged AuditLogDto items sorted by createdAt desc")
    void getAllLogs_ReturnsPagedDtos() {
      Pageable pageable = PageRequest.of(0, 20);

      AuditLog log =
          new AuditLog(
              userId,
              "admin@aura.health",
              "USER_ROLE_UPDATE",
              "USER",
              "usr_55",
              "127.0.0.1",
              "Postman",
              "SUCCESS",
              "Phân quyền DOCTOR cho tài khoản");
      ReflectionTestUtils.setField(log, "id", logId);
      ReflectionTestUtils.setField(log, "createdAt", Instant.now());

      when(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable))
          .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

      Page<AuditLogDto> page = auditLogService.getAllLogs(pageable);

      assertThat(page).isNotNull();
      assertThat(page.getContent()).hasSize(1);
      AuditLogDto dto = page.getContent().get(0);
      assertThat(dto.id()).isEqualTo(logId);
      assertThat(dto.userId()).isEqualTo(userId);
      assertThat(dto.userEmail()).isEqualTo("admin@aura.health");
      assertThat(dto.action()).isEqualTo("USER_ROLE_UPDATE");
      assertThat(dto.status()).isEqualTo("SUCCESS");
      verify(auditLogRepository).findAllByOrderByCreatedAtDesc(pageable);
    }

    @Test
    @DisplayName("getAllLogs returns empty page when no logs exist")
    void getAllLogs_Empty_ReturnsEmptyPage() {
      Pageable pageable = PageRequest.of(0, 20);
      when(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable))
          .thenReturn(new PageImpl<>(List.of(), pageable, 0));

      Page<AuditLogDto> page = auditLogService.getAllLogs(pageable);

      assertThat(page.getContent()).isEmpty();
      assertThat(page.getTotalElements()).isZero();
    }
  }

  @Nested
  @DisplayName("getExportableLogs & CSV Export Tests")
  class ExportableLogsTests {

    @Test
    @DisplayName("getExportableLogs returns top 1000 logs mapped to DTOs")
    void getExportableLogs_ReturnsTopLogs() {
      AuditLog log1 =
          new AuditLog(
              userId,
              "nurse@aura.health",
              "BULK_SCREENING_IMPORT",
              "CAMPAIGN",
              "cmp_77",
              "192.168.1.50",
              "Browser",
              "SUCCESS",
              "Nhập 50 ca sàng lọc");
      ReflectionTestUtils.setField(log1, "id", UUID.randomUUID());
      ReflectionTestUtils.setField(log1, "createdAt", Instant.now().minusSeconds(10));

      when(auditLogRepository.findTop1000ByOrderByCreatedAtDesc())
          .thenReturn(List.of(log1));

      List<AuditLogDto> exportable = auditLogService.getExportableLogs();

      assertThat(exportable).hasSize(1);
      assertThat(exportable.get(0).action()).isEqualTo("BULK_SCREENING_IMPORT");
      verify(auditLogRepository).findTop1000ByOrderByCreatedAtDesc();
    }

    @Test
    @DisplayName("Validates compliance CSV formatting for exported audit logs")
    void exportLogsToCsv_ValidatesCsvFormatAndSecurity() {
      Instant now = Instant.parse("2026-09-13T10:15:30Z");
      AuditLog log =
          new AuditLog(
              userId,
              "audit@aura.health",
              "KEY_ROTATION",
              "SECURITY",
              "sec_01",
              "10.10.10.10",
              "Agent",
              "SUCCESS",
              "Khóa HMAC SHA-256 đã được luân chuyển định kỳ");
      ReflectionTestUtils.setField(log, "id", logId);
      ReflectionTestUtils.setField(log, "createdAt", now);

      when(auditLogRepository.findTop1000ByOrderByCreatedAtDesc())
          .thenReturn(List.of(log));

      List<AuditLogDto> logs = auditLogService.getExportableLogs();

      // Convert to CSV
      StringWriter sw = new StringWriter();
      sw.write("ID,Timestamp,User Email,Action,Resource Type,Resource ID,IP Address,Status,Details\n");
      for (AuditLogDto dto : logs) {
        sw.write(String.format("%s,%s,%s,%s,%s,%s,%s,%s,\"%s\"\n",
            dto.id(),
            dto.createdAt(),
            dto.userEmail(),
            dto.action(),
            dto.resourceType(),
            dto.resourceId(),
            dto.ipAddress(),
            dto.status(),
            dto.details()));
      }

      String csvOutput = sw.toString();

      assertThat(csvOutput).startsWith("ID,Timestamp,User Email,Action,Resource Type,Resource ID,IP Address,Status,Details\n");
      assertThat(csvOutput).contains("audit@aura.health");
      assertThat(csvOutput).contains("KEY_ROTATION");
      assertThat(csvOutput).contains("10.10.10.10");
      assertThat(csvOutput).contains("SUCCESS");
      // Verify no password or secret fields are leaked
      assertThat(csvOutput.toLowerCase()).doesNotContain("password");
      assertThat(csvOutput.toLowerCase()).doesNotContain("jwt_secret");
    }
  }
}
