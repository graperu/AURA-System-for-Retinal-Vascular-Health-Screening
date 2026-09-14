package com.aura.bulk.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import org.junit.jupiter.api.AfterEach;
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
@DisplayName("BulkProcessingWorker - Optimized Risk Matrix, Status Transition & Null Safety Tests")
class BulkProcessingWorkerOptimizedTest {

  @Mock private BatchJobQueue jobQueue;
  @Mock private AiServiceClient aiServiceClient;
  @Mock private BulkScreeningItemRepository itemRepository;
  @Mock private BulkScreeningBatchRepository batchRepository;

  private BulkProcessingWorker worker;

  @BeforeEach
  void setUp() {
    worker = new BulkProcessingWorker(jobQueue, aiServiceClient, itemRepository, batchRepository);
  }

  @AfterEach
  void tearDown() {
    ExecutorService executor = (ExecutorService) ReflectionTestUtils.getField(worker, "executorService");
    if (executor != null && !executor.isShutdown()) {
      executor.shutdownNow();
    }
  }

  private void invokeSyncSuccess(BulkProcessingWorker target, BatchItemTask task, long elapsedMs, AiInferenceResultDto result) throws Exception {
    Method m = BulkProcessingWorker.class.getDeclaredMethod("syncItemAndBatchSuccess", BatchItemTask.class, long.class, AiInferenceResultDto.class);
    m.setAccessible(true);
    m.invoke(target, task, elapsedMs, result);
  }

  private void invokeSyncFailure(BulkProcessingWorker target, BatchItemTask task, Exception ex) throws Exception {
    Method m = BulkProcessingWorker.class.getDeclaredMethod("syncItemAndBatchFailure", BatchItemTask.class, Exception.class);
    m.setAccessible(true);
    m.invoke(target, task, ex);
  }

  private String invokeDetermineRiskLevel(BulkProcessingWorker target, AiInferenceResultDto result) throws Exception {
    Method m = BulkProcessingWorker.class.getDeclaredMethod("determineRiskLevel", AiInferenceResultDto.class);
    m.setAccessible(true);
    return (String) m.invoke(target, result);
  }

  private BatchItemTask createSampleTask(String batchCode, String itemCode) {
    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "anon-1", "MRN-ANON-1", 45, "Male", 120, 80, 5.5, false, false, Instant.now()
    );
    return new BatchItemTask(batchCode, itemCode, "fundus.png", "OD", patient, "payload");
  }

  private AiInferenceResultDto createSampleAiResult(int score, String cardioRiskLevel) {
    return new AiInferenceResultDto(
        "analysis-1", 150L, score, score, cardioRiskLevel, 50, "Low", 15.0, 0.65, 18.0, 1.1, 0.35, "heatmap", 1, List.of("Norm")
    );
  }

  @Test
  @DisplayName("Null repo fallback: Worker khởi tạo với constructor 2 tham số (repos=null) sync an toàn không ném NPE")
  void testNullRepositoryFallbackSafety() throws Exception {
    BulkProcessingWorker twoArgWorker = new BulkProcessingWorker(jobQueue, aiServiceClient);
    BatchItemTask task = createSampleTask("batch-null", "item-null");
    AiInferenceResultDto result = createSampleAiResult(50, "Moderate");

    // Success sync with null repos
    invokeSyncSuccess(twoArgWorker, task, 200L, result);

    // Failure sync with null repos
    invokeSyncFailure(twoArgWorker, task, new RuntimeException("Test error"));

    // Verify no repository interactions were attempted
    verify(batchRepository, never()).findByBatchCode(any());
    verify(itemRepository, never()).save(any());
  }

  @Test
  @DisplayName("Missing batch log: Khi không tìm thấy batch trong database -> log warn và không crash")
  void testMissingBatchInDatabaseHandledGracefully() throws Exception {
    BatchItemTask task = createSampleTask("batch-missing", "item-1");
    when(batchRepository.findByBatchCode("batch-missing")).thenReturn(Optional.empty());

    // Both success and failure calls must handle missing batch without exception
    invokeSyncSuccess(worker, task, 100L, createSampleAiResult(30, "Low"));
    invokeSyncFailure(worker, task, new RuntimeException("AI down"));

    verify(itemRepository, never()).save(any());
  }

  @ParameterizedTest(name = "Batch transition: initialStatus=''{0}'', processed={1}, failed={2}, total={3} -> expectedStatus=''{4}''")
  @CsvSource({
    // Initial QUEUED, item 1 finishes (total 5) -> IN_PROGRESS
    "'QUEUED', 0, 0, 5, 'IN_PROGRESS'",
    // Initial IN_PROGRESS, item 2 finishes (total 5) -> stays IN_PROGRESS
    "'IN_PROGRESS', 1, 0, 5, 'IN_PROGRESS'",
    // Initial IN_PROGRESS, item 5 finishes (4 processed + 1 new = 5 total) -> COMPLETED
    "'IN_PROGRESS', 4, 0, 5, 'COMPLETED'",
    // Initial QUEUED with 1 total image finishes immediately -> COMPLETED
    "'QUEUED', 0, 0, 1, 'COMPLETED'"
  })
  @DisplayName("Batch status transition on SUCCESS: QUEUED -> IN_PROGRESS -> COMPLETED")
  void testBatchStatusTransitionOnSuccess(String initialStatus, int processed, int failed, int total, String expectedStatus) throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-trans", UUID.randomUUID(), total);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setStatus(initialStatus);
    batch.setProcessedCount(processed);
    batch.setFailedCount(failed);

    BulkScreeningItem item = new BulkScreeningItem(batchId, "item-trans", "fundus.png", "OD", "anon-1");

    when(batchRepository.findByBatchCode("batch-trans")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-trans")).thenReturn(Optional.of(item));

    BatchItemTask task = createSampleTask("batch-trans", "item-trans");
    invokeSyncSuccess(worker, task, 150L, createSampleAiResult(50, "Moderate"));

    ArgumentCaptor<BulkScreeningBatch> batchCaptor = ArgumentCaptor.forClass(BulkScreeningBatch.class);
    verify(batchRepository).save(batchCaptor.capture());

    BulkScreeningBatch savedBatch = batchCaptor.getValue();
    assertThat(savedBatch.getStatus()).isEqualTo(expectedStatus);
    assertThat(savedBatch.getProcessedCount()).isEqualTo(processed + 1);
  }

  @ParameterizedTest(name = "Batch transition on FAILURE: initialStatus=''{0}'', processed={1}, failed={2}, total={3} -> expectedStatus=''{4}''")
  @CsvSource({
    // Initial QUEUED, item 1 fails (total 4) -> IN_PROGRESS
    "'QUEUED', 0, 0, 4, 'IN_PROGRESS'",
    // Initial IN_PROGRESS, item 2 fails (1 processed, 1 failed, total 4) -> IN_PROGRESS
    "'IN_PROGRESS', 1, 1, 4, 'IN_PROGRESS'",
    // Final item fails: processed=2, failed=1, +1 new fail = 4 total -> COMPLETED
    "'IN_PROGRESS', 2, 1, 4, 'COMPLETED'",
    // Initial QUEUED with 1 image fails immediately -> COMPLETED
    "'QUEUED', 0, 0, 1, 'COMPLETED'"
  })
  @DisplayName("Batch status transition on FAILURE: QUEUED -> IN_PROGRESS -> COMPLETED")
  void testBatchStatusTransitionOnFailure(String initialStatus, int processed, int failed, int total, String expectedStatus) throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-fail-trans", UUID.randomUUID(), total);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setStatus(initialStatus);
    batch.setProcessedCount(processed);
    batch.setFailedCount(failed);

    BulkScreeningItem item = new BulkScreeningItem(batchId, "item-fail-trans", "fundus.png", "OD", "anon-1");

    when(batchRepository.findByBatchCode("batch-fail-trans")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-fail-trans")).thenReturn(Optional.of(item));

    BatchItemTask task = createSampleTask("batch-fail-trans", "item-fail-trans");
    invokeSyncFailure(worker, task, new RuntimeException("Inference failed"));

    ArgumentCaptor<BulkScreeningBatch> batchCaptor = ArgumentCaptor.forClass(BulkScreeningBatch.class);
    verify(batchRepository).save(batchCaptor.capture());

    BulkScreeningBatch savedBatch = batchCaptor.getValue();
    assertThat(savedBatch.getStatus()).isEqualTo(expectedStatus);
    assertThat(savedBatch.getFailedCount()).isEqualTo(failed + 1);
  }

  @ParameterizedTest(name = "Risk Matrix Mapping: score={0}, level=''{1}'' -> expectedRisk=''{2}''")
  @CsvSource({
    // Score >= 80 boundaries -> CRITICAL (MED-04)
    "80, 'Low', 'CRITICAL'",
    "85, 'Low', 'CRITICAL'",
    "86, 'Normal', 'CRITICAL'",
    "100, 'Low', 'CRITICAL'",
    // String "Critical" or "Severe" -> CRITICAL regardless of score
    "0, 'Critical', 'CRITICAL'",
    "10, 'critical', 'CRITICAL'",
    "20, 'CRITICAL', 'CRITICAL'",
    "0, 'Severe', 'CRITICAL'",
    "35, 'severe', 'CRITICAL'",
    // Score >= 65 boundaries (< 80) -> HIGH (MED-04)
    "65, 'Low', 'HIGH'",
    "70, 'Low', 'HIGH'",
    "71, 'Low', 'HIGH'",
    "79, 'Low', 'HIGH'",
    // String "High" -> HIGH
    "20, 'High', 'HIGH'",
    "50, 'high', 'HIGH'",
    // Score >= 40 boundaries (< 65) -> MODERATE (MED-04)
    "40, 'Low', 'MODERATE'",
    "41, 'Low', 'MODERATE'",
    "64, 'Low', 'MODERATE'",
    // String "Moderate" -> MODERATE
    "15, 'Moderate', 'MODERATE'",
    "30, 'moderate', 'MODERATE'",
    // Score < 40 and not in above -> LOW
    "39, 'Low', 'LOW'",
    "39, 'Normal', 'LOW'",
    "0, 'Low', 'LOW'",
    "25, 'Unknown', 'LOW'",
    "0, '', 'LOW'"
  })
  @DisplayName("Mapping đầy đủ ma trận điểm số rủi ro: >=80, >=65, >=40, <40 và chuỗi nhãn AI tương ứng")
  void testDetermineRiskLevelComprehensiveMatrix(int score, String cardioLevel, String expectedRisk) throws Exception {
    AiInferenceResultDto result = createSampleAiResult(score, cardioLevel.isEmpty() ? null : cardioLevel);
    String actualRisk = invokeDetermineRiskLevel(worker, result);
    assertThat(actualRisk).isEqualTo(expectedRisk);
  }

  @Test
  @DisplayName("syncItemAndBatchSuccess: Cờ đếm null trong Batch entity và xaiRationales null")
  void testSyncSuccessWithNullCountersAndNullXaiRationales() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-null-counters", UUID.randomUUID(), null);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setProcessedCount(null);
    batch.setFailedCount(null);
    batch.setTotalImages(null);

    BulkScreeningItem item = new BulkScreeningItem(batchId, "item-1", "eye.png", "OD", "anon-1");

    when(batchRepository.findByBatchCode("batch-null-counters")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-1")).thenReturn(Optional.of(item));

    AiInferenceResultDto resultWithNullXai = new AiInferenceResultDto(
        "analysis-null-xai", 100L, 50, 50, "MODERATE", 30, "LOW", 15.0, 0.65, 18.0, 1.1, 0.35, "heatmap", 0, null
    );

    BatchItemTask task = createSampleTask("batch-null-counters", "item-1");
    invokeSyncSuccess(worker, task, 100L, resultWithNullXai);

    ArgumentCaptor<BulkScreeningItem> itemCaptor = ArgumentCaptor.forClass(BulkScreeningItem.class);
    verify(itemRepository).save(itemCaptor.capture());
    assertThat(itemCaptor.getValue().getFindings()).isNull();

    ArgumentCaptor<BulkScreeningBatch> batchCaptor = ArgumentCaptor.forClass(BulkScreeningBatch.class);
    verify(batchRepository).save(batchCaptor.capture());
    assertThat(batchCaptor.getValue().getProcessedCount()).isEqualTo(1);
  }

  @Test
  @DisplayName("syncItemAndBatchFailure: Cờ đếm null trong Batch và exception message null fallback 'Unknown AI processing error'")
  void testSyncFailureWithNullCountersAndNullExceptionMessage() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-fail-null", UUID.randomUUID(), null);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setProcessedCount(null);
    batch.setFailedCount(null);
    batch.setTotalImages(null);

    BulkScreeningItem item = new BulkScreeningItem(batchId, "item-fail", "eye.png", "OD", "anon-1");

    when(batchRepository.findByBatchCode("batch-fail-null")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-fail")).thenReturn(Optional.of(item));

    BatchItemTask task = createSampleTask("batch-fail-null", "item-fail");
    invokeSyncFailure(worker, task, new RuntimeException((String) null)); // null message

    ArgumentCaptor<BulkScreeningItem> itemCaptor = ArgumentCaptor.forClass(BulkScreeningItem.class);
    verify(itemRepository).save(itemCaptor.capture());
    assertThat(itemCaptor.getValue().getErrorMessage()).isEqualTo("Unknown AI processing error");

    ArgumentCaptor<BulkScreeningBatch> batchCaptor = ArgumentCaptor.forClass(BulkScreeningBatch.class);
    verify(batchRepository).save(batchCaptor.capture());
    assertThat(batchCaptor.getValue().getFailedCount()).isEqualTo(0); // failedCount null -> 0 per worker implementation

    // If failedCount is not null (e.g. 2) -> increments to 3
    batch.setFailedCount(2);
    invokeSyncFailure(worker, task, new RuntimeException("Another error"));
    verify(batchRepository, org.mockito.Mockito.times(2)).save(batchCaptor.capture());
    assertThat(batchCaptor.getValue().getFailedCount()).isEqualTo(3);
  }

  @Test
  @DisplayName("syncItemAndBatch: Khi item không tìm thấy trong database (itemOpt.isEmpty()) -> chỉ cập nhật batch an toàn")
  void testSyncItemNotFoundInDatabaseHandledSafely() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-item-missing", UUID.randomUUID(), 5);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setProcessedCount(0);
    batch.setFailedCount(0);

    when(batchRepository.findByBatchCode("batch-item-missing")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-missing")).thenReturn(Optional.empty());

    BatchItemTask task = createSampleTask("batch-item-missing", "item-missing");

    // Success call
    invokeSyncSuccess(worker, task, 100L, createSampleAiResult(50, "Moderate"));
    verify(itemRepository, never()).save(any());
    verify(batchRepository).save(batch);

    // Failure call
    invokeSyncFailure(worker, task, new RuntimeException("Error"));
    verify(itemRepository, never()).save(any());
  }

  @Test
  @DisplayName("syncItemAndBatch: Khi database ném Exception trong save -> bắt an toàn trong catch block không làm chết worker thread")
  void testSyncDatabaseExceptionCatchBlocks() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-db-ex", UUID.randomUUID(), 5);
    ReflectionTestUtils.setField(batch, "id", batchId);
    when(batchRepository.findByBatchCode("batch-db-ex")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(any(), any())).thenThrow(new RuntimeException("DB Connection Lost"));

    BatchItemTask task = createSampleTask("batch-db-ex", "item-ex");

    // Success sync catches safely
    invokeSyncSuccess(worker, task, 100L, createSampleAiResult(50, "Moderate"));

    // Failure sync catches safely
    invokeSyncFailure(worker, task, new RuntimeException("AI error"));
  }

  @Test
  @DisplayName("totalImagesOf: Trả về 0 khi totalImages là null và trả về giá trị thực khi khác null")
  void testTotalImagesOfReflection() throws Exception {
    Method totalImagesOfMethod = BulkProcessingWorker.class.getDeclaredMethod("totalImagesOf", BulkScreeningBatch.class);
    totalImagesOfMethod.setAccessible(true);

    BulkScreeningBatch batchWithNull = new BulkScreeningBatch("b1", UUID.randomUUID(), null);
    batchWithNull.setTotalImages(null);
    int res1 = (int) totalImagesOfMethod.invoke(worker, batchWithNull);
    assertThat(res1).isEqualTo(0);

    BulkScreeningBatch batchWithVal = new BulkScreeningBatch("b2", UUID.randomUUID(), 42);
    int res2 = (int) totalImagesOfMethod.invoke(worker, batchWithVal);
    assertThat(res2).isEqualTo(42);
  }

  @Test
  @DisplayName("syncItemAndBatchSuccess: Xử lý an toàn khi các trường đếm của batch là null và xaiRationales là null")
  void testSyncSuccessNullCountsAndNullXaiRationales() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("b-null-counts", UUID.randomUUID(), null);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setProcessedCount(null);
    batch.setFailedCount(null);
    batch.setTotalImages(null);
    batch.setStatus("QUEUED");

    BulkScreeningItem item = new BulkScreeningItem(batchId, "item-null-counts", "img.png", "OD", "P-1");
    when(batchRepository.findByBatchCode("b-null-counts")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-null-counts")).thenReturn(Optional.of(item));

    AiInferenceResultDto resultWithoutXai = new AiInferenceResultDto(
        "res-1", 100L, 50, 50, "MODERATE", 30, "LOW", 15.0, 0.62, 17.0, 1.15, 0.35, null, 0, null
    );

    BatchItemTask task = createSampleTask("b-null-counts", "item-null-counts");
    invokeSyncSuccess(worker, task, 100L, resultWithoutXai);

    verify(itemRepository).save(item);
    assertThat(item.getFindings()).isNull();
    assertThat(item.getStatus()).isEqualTo("COMPLETED");

    verify(batchRepository).save(batch);
    assertThat(batch.getProcessedCount()).isEqualTo(1);
    // processed (1) + failed (0) >= total (0) -> COMPLETED
    assertThat(batch.getStatus()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("syncItemAndBatchFailure: Xử lý an toàn khi Exception message là null và batch counts là null")
  void testSyncFailureNullMessageAndNullCounts() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("b-fail-null", UUID.randomUUID(), 10);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setProcessedCount(null);
    batch.setFailedCount(null);
    batch.setStatus("QUEUED");

    BulkScreeningItem item = new BulkScreeningItem(batchId, "item-fail-null", "img.png", "OD", "P-1");
    when(batchRepository.findByBatchCode("b-fail-null")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "item-fail-null")).thenReturn(Optional.of(item));

    BatchItemTask task = createSampleTask("b-fail-null", "item-fail-null");
    // Exception without message
    invokeSyncFailure(worker, task, new RuntimeException((String) null));

    verify(itemRepository).save(item);
    assertThat(item.getStatus()).isEqualTo("FAILED");
    assertThat(item.getErrorMessage()).isEqualTo("Unknown AI processing error");

    verify(batchRepository).save(batch);
    // batch.getFailedCount() is null -> ternary evaluates to 0
    assertThat(batch.getFailedCount()).isEqualTo(0);
    // processed (0) + failed (0) < total (10) -> chuyển QUEUED sang IN_PROGRESS
    assertThat(batch.getStatus()).isEqualTo("IN_PROGRESS");
  }

  @Test
  @DisplayName("sync: Bắt Exception khi batchRepository.findByBatchCode ném lỗi cơ sở dữ liệu")
  void testSyncBatchRepoFindByBatchCodeThrowsException() throws Exception {
    when(batchRepository.findByBatchCode("b-crash")).thenThrow(new RuntimeException("DB Connection Timeout"));
    BatchItemTask task = createSampleTask("b-crash", "it-crash");

    // Must not throw any exception
    invokeSyncSuccess(worker, task, 100L, createSampleAiResult(50, "Moderate"));
    invokeSyncFailure(worker, task, new RuntimeException("AI error"));
  }

  @Test
  @DisplayName("syncItemAndBatchSuccess: Chuyển status QUEUED sang IN_PROGRESS khi chưa đạt totalImages")
  void testSyncSuccessTransitionsQueuedToInProgress() throws Exception {
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("b-queued", UUID.randomUUID(), 10);
    ReflectionTestUtils.setField(batch, "id", batchId);
    batch.setProcessedCount(0);
    batch.setFailedCount(0);
    batch.setStatus("QUEUED");

    BulkScreeningItem item = new BulkScreeningItem(batchId, "it-q", "img.png", "OD", "P-1");
    when(batchRepository.findByBatchCode("b-queued")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchId, "it-q")).thenReturn(Optional.of(item));

    BatchItemTask task = createSampleTask("b-queued", "it-q");
    invokeSyncSuccess(worker, task, 100L, createSampleAiResult(50, "Moderate"));

    assertThat(batch.getStatus()).isEqualTo("IN_PROGRESS");
  }
}
