package com.aura.bulk.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.bulk.dto.BatchJobItemStatusDto;
import com.aura.bulk.dto.BatchJobResponseDto;
import com.aura.bulk.dto.BulkBatchAlertDto;
import com.aura.bulk.dto.BulkBatchAlertSummaryDto;
import com.aura.bulk.dto.BulkBatchRiskStatisticsDto;
import com.aura.bulk.dto.BulkImageItemUploadDto;
import com.aura.bulk.dto.BulkUploadRequestDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.dto.RiskDistributionDto;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.service.PatientAnonymizerService;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class BulkScreeningControllerTest {

  @Mock
  private PatientAnonymizerService anonymizerService;

  @Mock
  private BatchJobQueue jobQueue;

  private BulkScreeningController controller;

  @BeforeEach
  void setUp() {
    controller = new BulkScreeningController(anonymizerService, jobQueue);
  }

  @Nested
  @DisplayName("POST /api/v1/bulk-screening/batch - Tạo batch job sàng lọc hàng loạt")
  class CreateBulkBatchJobTests {

    @Test
    @DisplayName("Thất bại: Danh sách ảnh null -> trả về HTTP 400 Bad Request")
    void createBulkBatchJob_whenImageItemsNull_returnsBadRequest() {
      BulkUploadRequestDto request = new BulkUploadRequestDto("CLINIC-01", "Chiến dịch A", null);

      ResponseEntity<?> response = controller.createBulkBatchJob(request);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Danh sách ảnh tải lên không được để trống");
      verify(jobQueue, never()).createBatchJob(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("Thất bại: Danh sách ảnh rỗng -> trả về HTTP 400 Bad Request")
    void createBulkBatchJob_whenImageItemsEmpty_returnsBadRequest() {
      BulkUploadRequestDto request = new BulkUploadRequestDto("CLINIC-01", "Chiến dịch A", Collections.emptyList());

      ResponseEntity<?> response = controller.createBulkBatchJob(request);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Danh sách ảnh tải lên không được để trống");
      verify(jobQueue, never()).createBatchJob(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("Thành công: Đưa các ảnh vào hàng đợi -> trả về HTTP 202 ACCEPTED")
    void createBulkBatchJob_success() throws Exception {
      BulkImageItemUploadDto item = new BulkImageItemUploadDto(
          "fundus_od.png",
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
          "OD",
          "MRN-12345",
          "Nguyen Van An",
          58,
          "MALE",
          135,
          85,
          6.5
      );
      BulkUploadRequestDto request = new BulkUploadRequestDto("CLINIC-01", "Screening Campaign Q3", List.of(item));

      PatientAnonymizedDto anonymized = new PatientAnonymizedDto(
          "PSEUDO-HASH-001",
          "DE-ID-123",
          58,
          "MALE",
          135,
          85,
          6.5,
          false,
          true,
          Instant.now()
      );
      when(anonymizerService.anonymizePatient(
          eq("MRN-12345"), eq("Nguyen Van An"), eq(58), eq("MALE"), eq(135), eq(85), eq(6.5)))
          .thenReturn(anonymized);
      when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("STRIPPED-BASE64");

      BatchJobResponseDto expectedResponse = new BatchJobResponseDto(
          "BATCH-123456",
          "CLINIC-01",
          1,
          0,
          0,
          "QUEUED",
          Instant.now(),
          60.0,
          List.of()
      );
      when(jobQueue.getBatchStatus(anyString())).thenReturn(expectedResponse);

      ResponseEntity<?> response = controller.createBulkBatchJob(request);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
      assertThat(response.getBody()).isEqualTo(expectedResponse);

      verify(jobQueue).createBatchJob(anyString(), eq("CLINIC-01"), eq(1));
      verify(jobQueue).registerItem(anyString(), any(BatchJobItemStatusDto.class));
      verify(jobQueue).enqueue(any(BatchItemTask.class));
    }

    @Test
    @DisplayName("Thất bại: Bị gián đoạn hàng đợi (InterruptedException) -> trả về HTTP 500")
    void createBulkBatchJob_whenInterrupted_returnsInternalServerError() throws Exception {
      BulkImageItemUploadDto item = new BulkImageItemUploadDto(
          "fundus.png", "base64", "OD", "MRN-1", "Name", 45, "FEMALE", 120, 80, 5.5
      );
      BulkUploadRequestDto request = new BulkUploadRequestDto("CLINIC-01", "Campaign", List.of(item));

      when(anonymizerService.anonymizePatient(anyString(), anyString(), anyInt(), anyString(), anyInt(), anyInt(), anyDouble()))
          .thenReturn(new PatientAnonymizedDto("P-1", "D-1", 45, "FEMALE", 120, 80, 5.5, false, false, Instant.now()));
      when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("clean-b64");

      doThrow(new InterruptedException("Queue interrupted")).when(jobQueue).enqueue(any(BatchItemTask.class));

      ResponseEntity<?> response = controller.createBulkBatchJob(request);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Lỗi đưa ảnh vào hàng đợi");
    }
  }

  @Nested
  @DisplayName("GET /api/v1/bulk-screening/batches - Liệt kê tất cả đợt sàng lọc")
  class ListBatchesTests {

    @Test
    @DisplayName("Lấy danh sách các đợt sàng lọc thành công")
    void listBatches_returnsList() {
      BatchJobResponseDto batch = new BatchJobResponseDto(
          "BATCH-01", "CLINIC-01", 100, 50, 2, "IN_PROGRESS", Instant.now(), 120.0, List.of()
      );
      when(jobQueue.getAllBatches()).thenReturn(List.of(batch));

      ResponseEntity<List<BatchJobResponseDto>> response = controller.listBatches();

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isNotNull();
      assertThat(response.getBody()).hasSize(1);
      assertThat(response.getBody().get(0).batchId()).isEqualTo("BATCH-01");
    }
  }

  @Nested
  @DisplayName("GET /api/v1/bulk-screening/batch/{batchId} - Trạng thái tiến độ đợt sàng lọc")
  class GetBatchStatusTests {

    @Test
    @DisplayName("Tìm thấy batch -> trả về HTTP 200 OK")
    void getBatchStatus_whenFound_returnsStatus() {
      BatchJobResponseDto status = new BatchJobResponseDto(
          "BATCH-01", "CLINIC-01", 50, 50, 0, "COMPLETED", Instant.now(), 0.0, List.of()
      );
      when(jobQueue.getBatchStatus("BATCH-01")).thenReturn(status);

      ResponseEntity<?> response = controller.getBatchStatus("BATCH-01");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isEqualTo(status);
    }

    @Test
    @DisplayName("Không tìm thấy batch -> trả về HTTP 404 NOT FOUND")
    void getBatchStatus_whenNotFound_returns404() {
      when(jobQueue.getBatchStatus("INVALID-BATCH")).thenReturn(null);

      ResponseEntity<?> response = controller.getBatchStatus("INVALID-BATCH");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Không tìm thấy đợt sàng lọc hàng loạt");
    }
  }

  @Nested
  @DisplayName("GET /api/v1/bulk-screening/batch/{batchId}/statistics - Thống kê rủi ro tổng hợp (FR-25)")
  class GetAggregatedStatisticsTests {

    @Test
    @DisplayName("Tìm thấy thống kê -> trả về HTTP 200 OK")
    void getBatchRiskStatistics_whenFound_returnsStats() {
      RiskDistributionDto dist = new RiskDistributionDto(20, 40.0, 15, 30.0, 10, 20.0, 5, 10.0);
      BulkBatchRiskStatisticsDto stats = new BulkBatchRiskStatisticsDto(
          "BATCH-01", "CLINIC-01", 50, 50, 0, 0, 52.5, 18.2, 15, 3, dist, Instant.now()
      );
      when(jobQueue.calculateRiskStatistics("BATCH-01")).thenReturn(stats);

      ResponseEntity<?> response = controller.getBatchRiskStatistics("BATCH-01");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isEqualTo(stats);
    }

    @Test
    @DisplayName("Không tìm thấy batch -> trả về HTTP 404 NOT FOUND")
    void getBatchRiskStatistics_whenNotFound_returns404() {
      when(jobQueue.calculateRiskStatistics("NONEXISTENT")).thenReturn(null);

      ResponseEntity<?> response = controller.getBatchRiskStatistics("NONEXISTENT");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Không tìm thấy đợt sàng lọc");
    }
  }

  @Nested
  @DisplayName("GET /api/v1/bulk-screening/batch/{batchId}/alerts - Cảnh báo khẩn cấp rủi ro cao (FR-29)")
  class GetHighRiskAlertsTests {

    @Test
    @DisplayName("Tìm thấy cảnh báo -> trả về HTTP 200 OK")
    void getBatchAlerts_whenFound_returnsAlertSummary() {
      BulkBatchAlertDto alert = new BulkBatchAlertDto(
          "ALERT-01", "BATCH-01", "ITEM-01", "PSEUDO-01", "CRITICAL", 88, "CRITICAL", "Cảnh báo khẩn cấp", "Tổn thương vi mạch nghiêm trọng", 32.0, 3, "Chuyển tuyến khẩn cấp", Instant.now()
      );
      BulkBatchAlertSummaryDto summary = new BulkBatchAlertSummaryDto(
          "BATCH-01", "CLINIC-01", 1, 1, 0, false, null, List.of(alert)
      );
      when(jobQueue.detectAlertsAndTrends("BATCH-01")).thenReturn(summary);

      ResponseEntity<?> response = controller.getBatchAlerts("BATCH-01");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isEqualTo(summary);
    }

    @Test
    @DisplayName("Không tìm thấy batch -> trả về HTTP 404 NOT FOUND")
    void getBatchAlerts_whenNotFound_returns404() {
      when(jobQueue.detectAlertsAndTrends("UNKNOWN")).thenReturn(null);

      ResponseEntity<?> response = controller.getBatchAlerts("UNKNOWN");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Không tìm thấy đợt sàng lọc");
    }
  }

  @Nested
  @DisplayName("GET /api/v1/bulk-screening/batch/{batchId}/items/{itemId} - Chi tiết kết quả ảnh đơn lẻ")
  class GetBatchItemResultTests {

    @Test
    @DisplayName("Batch không tồn tại -> trả về HTTP 404")
    void getBatchItemResult_whenBatchNotFound_returns404() {
      when(jobQueue.getBatchStatus("BATCH-X")).thenReturn(null);

      ResponseEntity<?> response = controller.getBatchItemResult("BATCH-X", "ITEM-1");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Tìm thấy item trong batch -> trả về HTTP 200")
    void getBatchItemResult_whenItemFound_returnsItem() {
      BatchJobItemStatusDto item = new BatchJobItemStatusDto(
          "ITEM-1", "fundus.png", "OD", "PSEUDO-1", "COMPLETED", 1500L, null
      );
      BatchJobResponseDto batch = new BatchJobResponseDto(
          "BATCH-01", "CLINIC-01", 1, 1, 0, "COMPLETED", Instant.now(), 0.0, List.of(item)
      );
      when(jobQueue.getBatchStatus("BATCH-01")).thenReturn(batch);

      ResponseEntity<?> response = controller.getBatchItemResult("BATCH-01", "ITEM-1");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isEqualTo(item);
    }

    @Test
    @DisplayName("Không tìm thấy item trong batch -> trả về HTTP 404")
    void getBatchItemResult_whenItemNotFound_returns404() {
      BatchJobItemStatusDto item = new BatchJobItemStatusDto(
          "ITEM-1", "fundus.png", "OD", "PSEUDO-1", "COMPLETED", 1500L, null
      );
      BatchJobResponseDto batch = new BatchJobResponseDto(
          "BATCH-01", "CLINIC-01", 1, 1, 0, "COMPLETED", Instant.now(), 0.0, List.of(item)
      );
      when(jobQueue.getBatchStatus("BATCH-01")).thenReturn(batch);

      ResponseEntity<?> response = controller.getBatchItemResult("BATCH-01", "ITEM-999");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("message").toString()).contains("Không tìm thấy bản ghi ảnh");
    }
  }

  @Nested
  @DisplayName("POST /api/v1/bulk-screening/batch/{batchId}/cancel - Tạm dừng / Hủy đợt sàng lọc")
  class CancelBatchJobTests {

    @Test
    @DisplayName("Batch không tồn tại -> trả về HTTP 404")
    void cancelBatchJob_whenBatchNotFound_returns404() {
      when(jobQueue.getBatchStatus("BATCH-UNKNOWN")).thenReturn(null);

      ResponseEntity<?> response = controller.cancelBatchJob("BATCH-UNKNOWN");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
      verify(jobQueue, never()).cancelBatch(anyString());
    }

    @Test
    @DisplayName("Hủy batch thành công -> trả về HTTP 200")
    void cancelBatchJob_success() {
      BatchJobResponseDto batch = new BatchJobResponseDto(
          "BATCH-01", "CLINIC-01", 10, 2, 0, "IN_PROGRESS", Instant.now(), 45.0, List.of()
      );
      when(jobQueue.getBatchStatus("BATCH-01")).thenReturn(batch);

      ResponseEntity<?> response = controller.cancelBatchJob("BATCH-01");

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(jobQueue).cancelBatch("BATCH-01");
      Map<?, ?> body = (Map<?, ?>) response.getBody();
      assertThat(body).isNotNull();
      assertThat(body.get("batchId")).isEqualTo("BATCH-01");
    }
  }
}
