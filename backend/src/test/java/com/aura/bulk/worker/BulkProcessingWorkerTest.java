package com.aura.bulk.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BulkProcessingWorkerTest {

  @Mock
  private BatchJobQueue jobQueue;

  @Mock
  private AiServiceClient aiServiceClient;

  @Mock
  private BulkScreeningItemRepository itemRepository;

  @Mock
  private BulkScreeningBatchRepository batchRepository;

  @Mock
  private com.aura.billing.service.BillingService billingService;

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

  private void invokeProcessQueueLoop(BulkProcessingWorker targetWorker) throws Exception {
    Method loopMethod = BulkProcessingWorker.class.getDeclaredMethod("processQueueLoop");
    loopMethod.setAccessible(true);
    loopMethod.invoke(targetWorker);
    // Clear interrupted status of current test thread if set
    Thread.interrupted();
  }

  @Test
  @DisplayName("processQueueLoop xử lý thành công 1 task, cập nhật PROCESSING, COMPLETED và đồng bộ database")
  void processQueueLoop_successPath() throws Exception {
    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-99", "MRN-ANON-99", 52, "Male", 135, 88, 6.4, true, false, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("batch-01", "item-01", "scan_od.png", "OD", patient, "base64-data");

    AiInferenceResultDto aiResult = new AiInferenceResultDto(
        "analysis-1",
        200L,
        78,
        78,
        "High",
        60,
        "Moderate",
        18.0,
        0.58,
        15.4,
        1.25,
        0.38,
        "https://cdn.aura.test/heatmap.png",
        2,
        List.of("Microaneurysms detected")
    );

    when(jobQueue.dequeue())
        .thenReturn(task)
        .thenThrow(new InterruptedException("Queue consumer interrupted"));

    when(aiServiceClient.executeFundusAnalysis("ps-99", "OD", "base64-data"))
        .thenReturn(aiResult);

    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-01", UUID.randomUUID(), 1);
    ReflectionTestUtils.setField(batch, "id", batchUuid);

    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "item-01", "scan_od.png", "OD", "ps-99");

    when(batchRepository.findByBatchCode("batch-01")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "item-01")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(worker);

    verify(jobQueue).updateItemProgress("batch-01", "item-01", "PROCESSING", 0, null);
    verify(aiServiceClient).executeFundusAnalysis("ps-99", "OD", "base64-data");
    verify(jobQueue).updateItemProgress(eq("batch-01"), eq("item-01"), eq("COMPLETED"), anyLong(), eq(aiResult));

    // Verify DB sync
    verify(itemRepository).save(item);
    assertThat(item.getStatus()).isEqualTo("COMPLETED");
    assertThat(item.getRiskScore()).isEqualTo(78);
    assertThat(item.getRiskLevel()).isEqualTo("HIGH");
    assertThat(item.getProcessedAt()).isNotNull();

    verify(batchRepository).save(batch);
    assertThat(batch.getProcessedCount()).isEqualTo(1);
    assertThat(batch.getStatus()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("processQueueLoop khi AI microservice ném ngoại lệ -> cập nhật FAILED trong queue và database")
  void processQueueLoop_whenAiServiceThrowsException_handlesGracefully() throws Exception {
    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-err", "MRN-ERR", 60, "Female", 140, 90, 7.0, false, true, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("batch-err", "item-err", "scan_os.png", "OS", patient, "base64-err");

    when(jobQueue.dequeue())
        .thenReturn(task)
        .thenThrow(new InterruptedException("Stop loop"));

    when(aiServiceClient.executeFundusAnalysis(anyString(), anyString(), anyString()))
        .thenThrow(new RuntimeException("PyTorch service connection timeout"));

    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-err", UUID.randomUUID(), 1);
    ReflectionTestUtils.setField(batch, "id", batchUuid);

    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "item-err", "scan_os.png", "OS", "ps-err");

    when(batchRepository.findByBatchCode("batch-err")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "item-err")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(worker);

    verify(jobQueue).updateItemProgress("batch-err", "item-err", "PROCESSING", 0, null);
    verify(jobQueue, never()).updateItemProgress(eq("batch-err"), eq("item-err"), eq("COMPLETED"), anyLong(), any());
    verify(jobQueue).updateItemProgress("batch-err", "item-err", "FAILED", 0, null);

    // Verify DB sync on failure
    verify(itemRepository).save(item);
    assertThat(item.getStatus()).isEqualTo("FAILED");
    assertThat(item.getErrorMessage()).contains("PyTorch service connection timeout");
    assertThat(item.getProcessedAt()).isNotNull();

    verify(batchRepository).save(batch);
    assertThat(batch.getFailedCount()).isEqualTo(1);
    assertThat(batch.getStatus()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("processQueueLoop khi AI thất bại -> tự động hoàn trả 1 credit cho clinic qua billingService.refundCredit")
  void processQueueLoop_failurePath_autoRefundsCredit() throws Exception {
    BulkProcessingWorker workerWithBilling = new BulkProcessingWorker(
        jobQueue, aiServiceClient, itemRepository, batchRepository, billingService
    );

    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-err", "MRN-ERR", 60, "Female", 140, 90, 7.0, true, false, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("batch-refund", "item-refund", "scan.png", "OD", patient, "base64");

    when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException("Stop"));
    when(aiServiceClient.executeFundusAnalysis(any(), any(), any()))
        .thenThrow(new RuntimeException("Inference failure"));

    UUID clinicId = UUID.randomUUID();
    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-refund", clinicId, 1);
    ReflectionTestUtils.setField(batch, "id", batchUuid);

    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "item-refund", "scan.png", "OD", "ps-err");

    when(batchRepository.findByBatchCode("batch-refund")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "item-refund")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(workerWithBilling);

    verify(billingService).refundCredit(eq(clinicId), eq(1));
  }

  @Test
  @DisplayName("Adversarial: khi refundCredit ném ngoại lệ -> bắt an toàn, vẫn lưu item FAILED và cập nhật batch mà không crash worker thread")
  void processQueueLoop_failurePath_whenRefundCreditThrowsException_stillSyncsFailureGracefully() throws Exception {
    BulkProcessingWorker workerWithBilling = new BulkProcessingWorker(
        jobQueue, aiServiceClient, itemRepository, batchRepository, billingService
    );

    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-ex", "MRN-EX", 60, "Female", 140, 90, 7.0, true, false, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("batch-ex", "item-ex", "scan.png", "OD", patient, "base64");

    when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException("Stop"));
    when(aiServiceClient.executeFundusAnalysis(any(), any(), any()))
        .thenThrow(new RuntimeException("Inference failure"));

    UUID clinicId = UUID.randomUUID();
    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-ex", clinicId, 1);
    ReflectionTestUtils.setField(batch, "id", batchUuid);

    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "item-ex", "scan.png", "OD", "ps-ex");

    when(batchRepository.findByBatchCode("batch-ex")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "item-ex")).thenReturn(Optional.of(item));

    // Simulate billing service failure
    doThrow(new RuntimeException("Database timeout on refund transaction"))
        .when(billingService).refundCredit(eq(clinicId), eq(1));

    invokeProcessQueueLoop(workerWithBilling);

    // Verify refund was attempted
    verify(billingService).refundCredit(eq(clinicId), eq(1));

    // Verify item and batch status were still saved as FAILED despite billing error
    verify(itemRepository).save(item);
    assertThat(item.getStatus()).isEqualTo("FAILED");
    assertThat(item.getErrorMessage()).contains("Inference failure");

    verify(batchRepository).save(batch);
    assertThat(batch.getFailedCount()).isEqualTo(1);
    assertThat(batch.getStatus()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("Adversarial: khi clinicId là null trong batch -> bỏ qua refundCredit một cách an toàn không ném NullPointerException")
  void processQueueLoop_failurePath_whenClinicIdIsNull_doesNotCallRefundCredit() throws Exception {
    BulkProcessingWorker workerWithBilling = new BulkProcessingWorker(
        jobQueue, aiServiceClient, itemRepository, batchRepository, billingService
    );

    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-null-clinic", "MRN-NC", 50, "Male", 120, 80, 5.5, false, false, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("batch-nc", "item-nc", "scan.png", "OD", patient, "base64");

    when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException("Stop"));
    when(aiServiceClient.executeFundusAnalysis(any(), any(), any()))
        .thenThrow(new RuntimeException("Inference failure"));

    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-nc", null, 1); // null clinicId
    ReflectionTestUtils.setField(batch, "id", batchUuid);

    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "item-nc", "scan.png", "OD", "ps-null-clinic");

    when(batchRepository.findByBatchCode("batch-nc")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "item-nc")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(workerWithBilling);

    // Verify refundCredit was NEVER called because clinicId is null
    verify(billingService, never()).refundCredit(any(), anyInt());

    verify(itemRepository).save(item);
    assertThat(item.getStatus()).isEqualTo("FAILED");
  }

  @Test
  @DisplayName("Adversarial: khi task xử lý thành công -> tuyệt đối không gọi refundCredit")
  void processQueueLoop_successPath_doesNotTriggerRefundCredit() throws Exception {
    BulkProcessingWorker workerWithBilling = new BulkProcessingWorker(
        jobQueue, aiServiceClient, itemRepository, batchRepository, billingService
    );

    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-ok", "MRN-OK", 40, "Female", 115, 75, 5.0, false, false, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("batch-ok", "item-ok", "scan.png", "OD", patient, "base64");

    AiInferenceResultDto aiResult = new AiInferenceResultDto(
        "analysis-ok", 150L, 20, 20, "Low", 30, "Low", 15.0, 0.65, 18.0, 1.1, 0.35, "heatmap", 0, List.of()
    );

    when(jobQueue.dequeue()).thenReturn(task).thenThrow(new InterruptedException("Stop"));
    when(aiServiceClient.executeFundusAnalysis(any(), any(), any())).thenReturn(aiResult);

    UUID clinicId = UUID.randomUUID();
    UUID batchUuid = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("batch-ok", clinicId, 1);
    ReflectionTestUtils.setField(batch, "id", batchUuid);

    BulkScreeningItem item = new BulkScreeningItem(batchUuid, "item-ok", "scan.png", "OD", "ps-ok");

    when(batchRepository.findByBatchCode("batch-ok")).thenReturn(Optional.of(batch));
    when(itemRepository.findByBatchIdAndItemCode(batchUuid, "item-ok")).thenReturn(Optional.of(item));

    invokeProcessQueueLoop(workerWithBilling);

    // Verify refund was never triggered on success
    verify(billingService, never()).refundCredit(any(), anyInt());
    verify(itemRepository).save(item);
    assertThat(item.getStatus()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("processQueueLoop khi dequeue ném InterruptedException ngay lập tức -> ngắt luồng và dừng vòng lặp")
  void processQueueLoop_immediateInterruptedException_stopsWorker() throws Exception {
    when(jobQueue.dequeue()).thenThrow(new InterruptedException("Immediate interrupt"));

    invokeProcessQueueLoop(worker);

    verify(aiServiceClient, never()).executeFundusAnalysis(any(), any(), any());
    verify(jobQueue, never()).updateItemProgress(any(), any(), any(), anyLong(), any());
  }

  @Test
  @DisplayName("run() khởi chạy 4 consumer threads thông qua executorService")
  void run_submitsFourParallelWorkers() {
    ExecutorService mockExecutor = mock(ExecutorService.class);
    ReflectionTestUtils.setField(worker, "executorService", mockExecutor);

    worker.run("arg1", "arg2");

    verify(mockExecutor, times(4)).submit(any(Runnable.class));
  }

  @Test
  @DisplayName("run() với default executorService hoạt động và đóng sạch sẽ")
  void run_withDefaultExecutor_startsAndShutsDown() throws Exception {
    org.mockito.Mockito.lenient().when(jobQueue.dequeue()).thenThrow(new InterruptedException("Shutdown"));

    worker.run();

    ExecutorService executor = (ExecutorService) ReflectionTestUtils.getField(worker, "executorService");
    assertThat(executor).isNotNull();
    assertThat(executor.isShutdown()).isFalse();

    executor.shutdownNow();
    assertThat(executor.isShutdown()).isTrue();
  }

  @Test
  @DisplayName("DAT-02: syncItemAndBatchSuccess tự động tạo và lưu trữ Screening entity, cập nhật PatientProfile và phát STOMP event")
  void syncItemAndBatchSuccess_persistsScreeningAndUpdatesPatientProfile() {
    com.aura.screening.repository.ScreeningRepository screeningRepo = mock(com.aura.screening.repository.ScreeningRepository.class);
    com.aura.patient.repository.PatientProfileRepository patientRepo = mock(com.aura.patient.repository.PatientProfileRepository.class);
    com.aura.patient.repository.PatientMedicalProfileRepository medRepo = mock(com.aura.patient.repository.PatientMedicalProfileRepository.class);
    com.aura.user.repository.UserRepository userRepo = mock(com.aura.user.repository.UserRepository.class);
    com.aura.doctor.repository.DoctorPatientAssignmentRepository assignRepo = mock(com.aura.doctor.repository.DoctorPatientAssignmentRepository.class);
    com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepo = mock(com.aura.clinic.repository.ClinicMemberRepository.class);
    com.aura.realtime.RealtimeEventPublisher eventPublisher = mock(com.aura.realtime.RealtimeEventPublisher.class);

    BulkProcessingWorker customWorker = new BulkProcessingWorker(
        jobQueue, aiServiceClient, itemRepository, batchRepository,
        eventPublisher, billingService, screeningRepo, patientRepo, medRepo, userRepo, assignRepo, clinicMemberRepo
    );

    UUID clinicId = UUID.randomUUID();
    UUID batchId = UUID.randomUUID();
    BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-DAT02", clinicId, 1);
    batch.setId(batchId);
    when(batchRepository.findByBatchCode("BATCH-DAT02")).thenReturn(Optional.of(batch));

    BulkScreeningItem item = new BulkScreeningItem();
    item.setBatchId(batchId);
    item.setItemCode("ITEM-001");
    item.setRawMrn("MRN-TEST-123");
    item.setPatientName("Nguyễn Văn Test");
    item.setFileName("fundus.jpg");
    when(itemRepository.findByBatchIdAndItemCode(batchId, "ITEM-001")).thenReturn(Optional.of(item));

    com.aura.patient.entity.PatientProfile profile = new com.aura.patient.entity.PatientProfile("MRN-TEST-123", "Nguyễn Văn Test", 50, "Male", "0901234567");
    UUID patientUserId = UUID.randomUUID();
    profile.setUserId(patientUserId);
    when(patientRepo.findByMrn("MRN-TEST-123")).thenReturn(Optional.of(profile));

    when(screeningRepo.save(any(com.aura.screening.entity.Screening.class))).thenAnswer(invocation -> {
      com.aura.screening.entity.Screening s = invocation.getArgument(0);
      s.setId(UUID.randomUUID());
      return s;
    });

    PatientAnonymizedDto patientDto = new PatientAnonymizedDto("ps-1", "MRN-TEST-123", 50, "Male", 120, 80, 5.5, false, false, Instant.now());
    BatchItemTask task = new BatchItemTask("BATCH-DAT02", "ITEM-001", "fundus.jpg", "OD", patientDto, "base64-image-payload");

    AiInferenceResultDto aiResult = new AiInferenceResultDto(
        "analysis-dat02", 150L, 85, 82, "Critical", 75, "Severe", 26.5, 0.55, 14.2, 1.35, 0.45,
        "heatmap-base64", 2, List.of("Narrowing detected", "Hemorrhages present")
    );

    ReflectionTestUtils.invokeMethod(customWorker, "syncItemAndBatchSuccess", task, 150L, aiResult);

    org.mockito.ArgumentCaptor<com.aura.screening.entity.Screening> captor = org.mockito.ArgumentCaptor.forClass(com.aura.screening.entity.Screening.class);
    verify(screeningRepo, times(1)).save(captor.capture());
    com.aura.screening.entity.Screening saved = captor.getValue();

    assertThat(saved.getBatchId()).isEqualTo(batchId);
    assertThat(saved.getClinicId()).isEqualTo(clinicId);
    assertThat(saved.getPatientId()).isEqualTo(patientUserId);
    assertThat(saved.getStatus()).isEqualTo(com.aura.screening.entity.ScreeningStatus.ANALYZED);
    assertThat(saved.getRiskScore()).isEqualTo(85);
    assertThat(saved.getRiskLevel()).isEqualTo(com.aura.screening.entity.RiskLevel.CRITICAL);
    assertThat(saved.getHeatmapBase64()).isEqualTo("heatmap-base64");
    assertThat(saved.getCardiovascularRiskScore()).isEqualTo(82);
    assertThat(saved.getCardiovascularRiskLevel()).isEqualTo("Critical");
    assertThat(saved.getDiabeticRetinopathyRiskScore()).isEqualTo(75);
    assertThat(saved.getStrokeRiskLevel()).isEqualTo("CRITICAL");

    verify(patientRepo, times(1)).save(profile);
    assertThat(profile.getRiskScore()).isEqualTo(85);
    assertThat(profile.getRiskLevel()).isEqualTo("CRITICAL");
    assertThat(profile.getReviewStatus()).isEqualTo("PENDING_REVIEW");

    verify(eventPublisher, times(1)).publishScreeningCreated(any());
    verify(eventPublisher, times(1)).publishScreeningCompleted(any());

    ExecutorService customExec = (ExecutorService) ReflectionTestUtils.getField(customWorker, "executorService");
    if (customExec != null) customExec.shutdownNow();
  }
}
