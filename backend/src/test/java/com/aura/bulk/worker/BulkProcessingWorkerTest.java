package com.aura.bulk.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.service.AiServiceClient;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
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

  private BulkProcessingWorker worker;

  @BeforeEach
  void setUp() {
    worker = new BulkProcessingWorker(jobQueue, aiServiceClient);
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
  @DisplayName("processQueueLoop xử lý thành công 1 task, cập nhật PROCESSING và COMPLETED, sau đó thoát khi gặp InterruptedException")
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

    invokeProcessQueueLoop(worker);

    verify(jobQueue).updateItemProgress("batch-01", "item-01", "PROCESSING", 0, null);
    verify(aiServiceClient).executeFundusAnalysis("ps-99", "OD", "base64-data");
    verify(jobQueue).updateItemProgress(eq("batch-01"), eq("item-01"), eq("COMPLETED"), anyLong(), eq(aiResult));
  }

  @Test
  @DisplayName("processQueueLoop khi AI microservice ném ngoại lệ -> bắt lỗi an toàn và tiếp tục vòng lặp cho đến khi bị ngắt luồng")
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

    invokeProcessQueueLoop(worker);

    verify(jobQueue).updateItemProgress("batch-err", "item-err", "PROCESSING", 0, null);
    verify(jobQueue, never()).updateItemProgress(eq("batch-err"), eq("item-err"), eq("COMPLETED"), anyLong(), any());
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
}
