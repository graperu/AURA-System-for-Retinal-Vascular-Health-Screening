package com.aura.audit.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.audit.dto.AuditLogDto;
import com.aura.audit.service.AuditLogService;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.response.ApiResponse;
import com.aura.common.response.PageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AdminAuditControllerTest {

  @Mock
  private AuditLogService auditLogService;

  @InjectMocks
  private AdminAuditController controller;

  private MockMvc mockMvc;

  private UUID sampleLogId;
  private UUID sampleUserId;
  private AuditLogDto sampleAuditLogDto;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .build();

    sampleLogId = UUID.randomUUID();
    sampleUserId = UUID.randomUUID();
    sampleAuditLogDto = new AuditLogDto(
        sampleLogId,
        sampleUserId,
        "admin@aura.test",
        "UPDATE_USER_ROLE",
        "USER",
        sampleUserId.toString(),
        "127.0.0.1",
        "SUCCESS",
        "Phân quyền bác sĩ chuyên khoa CDS thành công",
        Instant.now()
    );
  }

  @Nested
  @DisplayName("GET /api/v1/admin/audit-logs - Lấy danh sách nhật ký kiểm toán phân trang")
  class GetAuditLogsTests {

    @Test
    @DisplayName("Lấy nhật ký kiểm toán với tham số mặc định (page=0, size=20) -> HTTP 200")
    void getAuditLogs_defaultParams_success() throws Exception {
      Page<AuditLogDto> page = new PageImpl<>(List.of(sampleAuditLogDto), PageRequest.of(0, 20), 1);
      when(auditLogService.getAllLogs(any(Pageable.class))).thenReturn(page);

      mockMvc.perform(get("/api/v1/admin/audit-logs"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.items[0].id").value(sampleLogId.toString()))
          .andExpect(jsonPath("$.data.items[0].userEmail").value("admin@aura.test"))
          .andExpect(jsonPath("$.data.items[0].action").value("UPDATE_USER_ROLE"))
          .andExpect(jsonPath("$.data.totalItems").value(1));

      verify(auditLogService).getAllLogs(any(Pageable.class));
    }

    @Test
    @DisplayName("Lấy nhật ký kiểm toán với phân trang tùy chỉnh (page=2, size=50) -> HTTP 200")
    void getAuditLogs_customPagination_success() throws Exception {
      Page<AuditLogDto> page = new PageImpl<>(List.of(sampleAuditLogDto), PageRequest.of(2, 50), 101);
      when(auditLogService.getAllLogs(any(Pageable.class))).thenReturn(page);

      mockMvc.perform(get("/api/v1/admin/audit-logs?page=2&size=50"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data.page").value(2))
          .andExpect(jsonPath("$.data.size").value(50))
          .andExpect(jsonPath("$.data.totalItems").value(101));

      verify(auditLogService).getAllLogs(any(Pageable.class));
    }
  }

  @Nested
  @DisplayName("GET /api/v1/admin/audit-logs/export - Xuất danh sách nhật ký kiểm toán")
  class ExportAuditLogsTests {

    @Test
    @DisplayName("Xuất danh sách nhật ký phục vụ tuân thủ & bảo mật -> HTTP 200")
    void exportAuditLogs_success() throws Exception {
      when(auditLogService.getExportableLogs()).thenReturn(List.of(sampleAuditLogDto));

      mockMvc.perform(get("/api/v1/admin/audit-logs/export"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.data[0].id").value(sampleLogId.toString()))
          .andExpect(jsonPath("$.data[0].action").value("UPDATE_USER_ROLE"))
          .andExpect(jsonPath("$.data[0].status").value("SUCCESS"));

      verify(auditLogService).getExportableLogs();
    }
  }

  @Test
  @DisplayName("Direct method coverage test")
  void directMethodCoverage_test() {
    Page<AuditLogDto> page = new PageImpl<>(List.of(sampleAuditLogDto));
    when(auditLogService.getAllLogs(any(Pageable.class))).thenReturn(page);

    ApiResponse<PageResponse<AuditLogDto>> response = controller.getAuditLogs(0, 10);
    assertThat(response.success()).isTrue();
    assertThat(response.data().items()).hasSize(1);
    assertThat(response.data().items().get(0).userEmail()).isEqualTo("admin@aura.test");

    when(auditLogService.getExportableLogs()).thenReturn(List.of(sampleAuditLogDto));
    ApiResponse<List<AuditLogDto>> exportResponse = controller.exportAuditLogs();
    assertThat(exportResponse.success()).isTrue();
    assertThat(exportResponse.data()).hasSize(1);
  }
}
