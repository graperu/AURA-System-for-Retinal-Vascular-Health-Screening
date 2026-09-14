package com.aura.bulk.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.bulk.dto.BatchJobItemStatusDto;
import com.aura.bulk.dto.BatchJobResponseDto;
import com.aura.bulk.dto.BulkBatchAlertSummaryDto;
import com.aura.bulk.dto.BulkBatchRiskStatisticsDto;
import com.aura.bulk.dto.BulkImageItemUploadDto;
import com.aura.bulk.dto.BulkUploadRequestDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.dto.RiskDistributionDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.PatientAnonymizerService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
@DisplayName("BulkScreeningController - Optimized DB Fallbacks & UUID Edge Case Unit Tests")
class BulkScreeningControllerOptimizedTest {

  @Mock private PatientAnonymizerService anonymizerService;
  @Mock private BatchJobQueue jobQueue;
  @Mock private BulkScreeningBatchRepository batchRepository;
  @Mock private BulkScreeningItemRepository itemRepository;

  private BulkScreeningController controller;

  @BeforeEach
  void setUp() {
    controller = new BulkScreeningController(anonymizerService, jobQueue, batchRepository, itemRepository);
  }

  private BulkImageItemUploadDto createItem(String fileName) {
    return new BulkImageItemUploadDto(
        fileName, "data:image/png;base64,RAW_BASE64", "OD", "MRN-100", "Nguyen Van A",
        55, "MALE", 130, 85, 6.0
    );
  }

  private PatientAnonymizedDto createAnonymizedPatient() {
    return new PatientAnonymizedDto(
        "ANON-P-001", "MRN-ANON-100", 55, "MALE", 130, 85, 6.0, false, false, Instant.now()
    );
  }

  @Test
  @DisplayName("createBulkBatchJob: clinicId là UUID hợp lệ -> lưu batch với clinicId chuẩn và lưu items vào itemRepository")
  void testCreateBulkBatchJobWithValidClinicUuid() {
    UUID clinicUuid = UUID.randomUUID();
    BulkUploadRequestDto request = new BulkUploadRequestDto(
        clinicUuid.toString(), "Chiến dịch Vi mạch 2026", List.of(createItem("scan1.png"))
    );

    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(createAnonymizedPatient());
    when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("STRIPPED_B64");

    UUID savedBatchId = UUID.randomUUID();
    when(batchRepository.save(any(BulkScreeningBatch.class))).thenAnswer(inv -> {
      BulkScreeningBatch b = inv.getArgument(0);
      org.springframework.test.util.ReflectionTestUtils.setField(b, "id", savedBatchId);
      return b;
    });

    when(jobQueue.getBatchStatus(anyString())).thenReturn(new BatchJobResponseDto(
        "BATCH-1", clinicUuid.toString(), 1, 0, 0, "QUEUED", Instant.now(), 10.0, List.of()
    ));

    ResponseEntity<?> response = controller.createBulkBatchJob(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

    ArgumentCaptor<BulkScreeningBatch> batchCaptor = ArgumentCaptor.forClass(BulkScreeningBatch.class);
    verify(batchRepository).save(batchCaptor.capture());
    assertThat(batchCaptor.getValue().getClinicId()).isEqualTo(clinicUuid);

    ArgumentCaptor<BulkScreeningItem> itemCaptor = ArgumentCaptor.forClass(BulkScreeningItem.class);
    verify(itemRepository).save(itemCaptor.capture());
    assertThat(itemCaptor.getValue().getBatchId()).isEqualTo(savedBatchId);
    assertThat(itemCaptor.getValue().getFileName()).isEqualTo("scan1.png");
  }

  @Test
  @DisplayName("createBulkBatchJob: clinicId không phải UUID hợp lệ -> fallback về UUID mặc định 33333333-3333-3333-3333-333333333333")
  void testCreateBulkBatchJobWithInvalidClinicUuidFallback() {
    BulkUploadRequestDto request = new BulkUploadRequestDto(
        "invalid-not-a-uuid", "Chiến dịch Fallback", List.of(createItem("scan2.png"))
    );

    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(createAnonymizedPatient());
    when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("STRIPPED_B64");

    ResponseEntity<?> response = controller.createBulkBatchJob(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);

    ArgumentCaptor<BulkScreeningBatch> batchCaptor = ArgumentCaptor.forClass(BulkScreeningBatch.class);
    verify(batchRepository).save(batchCaptor.capture());
    assertThat(batchCaptor.getValue().getClinicId())
        .isEqualTo(UUID.fromString("33333333-3333-3333-3333-333333333333"));
  }

  @Test
  @DisplayName("createBulkBatchJob: Khi batchRepository hoặc itemRepository ném Exception -> catch an toàn không làm hỏng request")
  void testCreateBulkBatchJobRepositoryExceptionsCaughtSafely() {
    UUID clinicUuid = UUID.randomUUID();
    BulkUploadRequestDto request = new BulkUploadRequestDto(
        clinicUuid.toString(), "Chiến dịch Exception", List.of(createItem("scan_err.png"))
    );

    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(createAnonymizedPatient());
    when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("STRIPPED_B64");

    // batchRepository ném Exception
    when(batchRepository.save(any(BulkScreeningBatch.class))).thenThrow(new RuntimeException("PostgreSQL down"));

    ResponseEntity<?> response = controller.createBulkBatchJob(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
    verify(itemRepository, never()).save(any()); // batchEntity is null -> itemRepository.save not called
  }

  @Test
  @DisplayName("createBulkBatchJob: Khi itemRepository.save ném Exception -> catch an toàn không làm hỏng request")
  void testCreateBulkBatchJobItemRepositoryExceptionCaughtSafely() {
    UUID clinicUuid = UUID.randomUUID();
    BulkUploadRequestDto request = new BulkUploadRequestDto(
        clinicUuid.toString(), "Chiến dịch Item Exception", List.of(createItem("scan_item_err.png"))
    );

    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(createAnonymizedPatient());
    when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("STRIPPED_B64");

    BulkScreeningBatch savedBatch = new BulkScreeningBatch("BATCH-OK", clinicUuid, 1);
    org.springframework.test.util.ReflectionTestUtils.setField(savedBatch, "id", UUID.randomUUID());
    when(batchRepository.save(any())).thenReturn(savedBatch);

    when(itemRepository.save(any())).thenThrow(new RuntimeException("Unique constraint violation"));

    ResponseEntity<?> response = controller.createBulkBatchJob(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
  }

  @Test
  @DisplayName("createBulkBatchJob: InterruptedException khi enqueue -> trả về HTTP 500")
  void testCreateBulkBatchJobInterruptedException() throws Exception {
    BulkUploadRequestDto request = new BulkUploadRequestDto(
        UUID.randomUUID().toString(), "Chiến dịch Interrupted", List.of(createItem("scan_int.png"))
    );

    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(createAnonymizedPatient());
    doThrow(new InterruptedException("Queue interrupted")).when(jobQueue).enqueue(any(BatchItemTask.class));

    ResponseEntity<?> response = controller.createBulkBatchJob(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    Map<?, ?> body = (Map<?, ?>) response.getBody();
    assertThat(body.get("message").toString()).contains("Lỗi đưa ảnh vào hàng đợi");
  }

  @Test
  @DisplayName("Endpoints kiểm tra trạng thái: getBatchStatus, getBatchRiskStatistics, getBatchAlerts, getBatchItemResult, cancelBatchJob")
  void testVariousEndpointsNotFoundAndFound() {
    String batchId = "batch-123";

    // 1. getBatchStatus
    when(jobQueue.getBatchStatus(batchId)).thenReturn(null).thenReturn(new BatchJobResponseDto(
        batchId, "clinic", 1, 0, 0, "QUEUED", Instant.now(), 5.0, List.of(
            new BatchJobItemStatusDto("item-1", "img.png", "OD", "P1", "QUEUED", 0, null)
        )
    ));
    assertThat(controller.getBatchStatus(batchId).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(controller.getBatchStatus(batchId).getStatusCode()).isEqualTo(HttpStatus.OK);

    // 2. getBatchRiskStatistics
    when(jobQueue.calculateRiskStatistics(batchId)).thenReturn(null).thenReturn(new BulkBatchRiskStatisticsDto(
        batchId, "clinic", 1, 1, 0, 0, 50.0, 15.0, 0, 0,
        new RiskDistributionDto(1, 100.0, 0, 0.0, 0, 0.0, 0, 0.0), Instant.now()
    ));
    assertThat(controller.getBatchRiskStatistics(batchId).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(controller.getBatchRiskStatistics(batchId).getStatusCode()).isEqualTo(HttpStatus.OK);

    // 3. getBatchAlerts
    when(jobQueue.detectAlertsAndTrends(batchId)).thenReturn(null).thenReturn(new BulkBatchAlertSummaryDto(
        batchId, "clinic", 0, 0, 0, false, null, List.of()
    ));
    assertThat(controller.getBatchAlerts(batchId).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(controller.getBatchAlerts(batchId).getStatusCode()).isEqualTo(HttpStatus.OK);

    // 4. getBatchItemResult
    when(jobQueue.getBatchStatus("notFoundBatch")).thenReturn(null);
    assertThat(controller.getBatchItemResult("notFoundBatch", "item-1").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

    when(jobQueue.getBatchStatus(batchId)).thenReturn(new BatchJobResponseDto(
        batchId, "clinic", 1, 0, 0, "QUEUED", Instant.now(), 5.0, List.of(
            new BatchJobItemStatusDto("item-1", "img.png", "OD", "P1", "QUEUED", 0, null)
        )
    ));
    assertThat(controller.getBatchItemResult(batchId, "item-1").getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(controller.getBatchItemResult(batchId, "item-not-found").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

    // 5. cancelBatchJob
    when(jobQueue.getBatchStatus("notFoundBatch")).thenReturn(null);
    assertThat(controller.cancelBatchJob("notFoundBatch").getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

    when(jobQueue.getBatchStatus(batchId)).thenReturn(new BatchJobResponseDto(
        batchId, "clinic", 1, 0, 0, "QUEUED", Instant.now(), 5.0, List.of()
    ));
    assertThat(controller.cancelBatchJob(batchId).getStatusCode()).isEqualTo(HttpStatus.OK);

    // 6. listBatches
    when(jobQueue.getAllBatches()).thenReturn(List.of());
    assertThat(controller.listBatches().getStatusCode()).isEqualTo(HttpStatus.OK);
  }

  @Test
  @DisplayName("createBulkBatchJob: Khởi tạo với constructor 2 tham số (repos=null) xử lý an toàn không ném NPE")
  void testCreateBulkBatchJobTwoArgConstructor() {
    BulkScreeningController simpleController = new BulkScreeningController(anonymizerService, jobQueue);
    UUID clinicUuid = UUID.randomUUID();
    BulkUploadRequestDto request = new BulkUploadRequestDto(
        clinicUuid.toString(), "Chiến dịch Null Repos", List.of(createItem("scan_simple.png"))
    );

    when(anonymizerService.anonymizePatient(any(), any(), anyInt(), any(), anyInt(), anyInt(), anyDouble()))
        .thenReturn(createAnonymizedPatient());
    when(anonymizerService.stripDicomMetadataHeaders(anyString())).thenReturn("STRIPPED_B64");
    when(jobQueue.getBatchStatus(anyString())).thenReturn(new BatchJobResponseDto(
        "BATCH-SIMPLE", clinicUuid.toString(), 1, 0, 0, "QUEUED", Instant.now(), 5.0, List.of()
    ));

    ResponseEntity<?> response = simpleController.createBulkBatchJob(request);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
  }

  @Test
  @DisplayName("createBulkBatchJob: Trả về HTTP 400 khi danh sách imageItems là null hoặc rỗng")
  void testCreateBulkBatchJobEmptyOrNullImages() {
    // 1. null imageItems
    BulkUploadRequestDto nullReq = new BulkUploadRequestDto("clinic-1", "Campaign", null);
    ResponseEntity<?> res1 = controller.createBulkBatchJob(nullReq);
    assertThat(res1.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

    // 2. empty imageItems
    BulkUploadRequestDto emptyReq = new BulkUploadRequestDto("clinic-1", "Campaign", List.of());
    ResponseEntity<?> res2 = controller.createBulkBatchJob(emptyReq);
    assertThat(res2.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
  }
}
