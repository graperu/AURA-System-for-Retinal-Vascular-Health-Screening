package com.aura.bulk.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import com.aura.realtime.RealtimeEventPublisher;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("BulkProcessingWorker Realtime WebSocket Push Tests (NFR-2)")
class BulkProcessingWorkerRealtimeTest {

  @Mock private BatchJobQueue jobQueue;
  @Mock private AiServiceClient aiServiceClient;
  @Mock private BulkScreeningItemRepository itemRepository;
  @Mock private BulkScreeningBatchRepository batchRepository;
  @Mock private RealtimeEventPublisher realtimeEventPublisher;

  private BulkProcessingWorker worker;

  @BeforeEach
  void setUp() {
    worker = new BulkProcessingWorker(
        jobQueue,
        aiServiceClient,
        itemRepository,
        batchRepository,
        realtimeEventPublisher
    );
  }

  @Test
  @DisplayName("Pushes BATCH_PROGRESS WebSocket event when item succeeds")
  void processQueueLoop_success_pushesRealtimeEvent() throws Exception {
    UUID clinicId = UUID.randomUUID();
    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-01", "MRN-01", 50, "MALE", 120, 80, 5.5, false, false, Instant.now());
    BatchItemTask task = new BatchItemTask("BATCH-RT-1", "ITEM-1", "scan.png", "OD", patient, "b64");

    AiInferenceResultDto aiResult = new AiInferenceResultDto(
        "ps-01", 120L, 70, 50, "MODERATE", 60, "HIGH", 18.0, 0.6, 15.0, 1.2, 0.4, "url", 1, List.of("finding")
    );

    when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException());
    when(aiServiceClient.executeFundusAnalysis(any(), any(), any())).thenReturn(aiResult);

    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-RT-1", clinicId, 10);
    ReflectionTestUtils.setField(batch, "id", batchUuid);
    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "ITEM-1", "scan.png", "OD", "ps-01");

    when(batchRepository.findByBatchCode("BATCH-RT-1")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "ITEM-1")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(worker);

    ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
    verify(realtimeEventPublisher).publishBatchProgress(eq(clinicId), captor.capture());

    Map<String, Object> payload = captor.getValue();
    assertThat(payload.get("batchId")).isEqualTo("BATCH-RT-1");
    assertThat(payload.get("total")).isEqualTo(10);
    assertThat(payload.get("processed")).isEqualTo(1);
    assertThat(payload.get("failed")).isEqualTo(0);
    assertThat(payload.get("status")).isEqualTo("IN_PROGRESS");
  }

  @Test
  @DisplayName("Pushes BATCH_PROGRESS WebSocket event when item fails")
  void processQueueLoop_failure_pushesRealtimeEvent() throws Exception {
    UUID clinicId = UUID.randomUUID();
    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-02", "MRN-02", 50, "MALE", 120, 80, 5.5, false, false, Instant.now());
    BatchItemTask task = new BatchItemTask("BATCH-RT-2", "ITEM-2", "scan2.png", "OS", patient, "b64");

    when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException());
    when(aiServiceClient.executeFundusAnalysis(any(), any(), any()))
        .thenThrow(new RuntimeException("Inference server offline"));

    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-RT-2", clinicId, 5);
    ReflectionTestUtils.setField(batch, "id", batchUuid);
    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "ITEM-2", "scan2.png", "OS", "ps-02");

    when(batchRepository.findByBatchCode("BATCH-RT-2")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "ITEM-2")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(worker);

    ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
    verify(realtimeEventPublisher).publishBatchProgress(eq(clinicId), captor.capture());

    Map<String, Object> payload = captor.getValue();
    assertThat(payload.get("batchId")).isEqualTo("BATCH-RT-2");
    assertThat(payload.get("total")).isEqualTo(5);
    assertThat(payload.get("processed")).isEqualTo(0);
    assertThat(payload.get("failed")).isEqualTo(1);
  }

  private void invokeProcessQueueLoop(BulkProcessingWorker targetWorker) throws Exception {
    Method method = BulkProcessingWorker.class.getDeclaredMethod("processQueueLoop");
    method.setAccessible(true);
    method.invoke(targetWorker);
  }
}
