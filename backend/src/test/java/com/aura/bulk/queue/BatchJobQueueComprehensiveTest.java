package com.aura.bulk.queue;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.BatchJobItemStatusDto;
import com.aura.bulk.dto.BatchJobResponseDto;
import com.aura.bulk.dto.BulkBatchAlertSummaryDto;
import com.aura.bulk.dto.BulkBatchRiskStatisticsDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BatchJobQueueComprehensiveTest {

  private BatchJobQueue queue;

  @BeforeEach
  void setUp() {
    queue = new BatchJobQueue();
  }

  private AiInferenceResultDto createAiResult(
      int score,
      String cardioLevel,
      double strokeRisk,
      int anomalies
  ) {
    return new AiInferenceResultDto(
        "analysis-uuid",
        1500L,
        score,
        score,
        cardioLevel,
        score,
        cardioLevel,
        strokeRisk,
        0.65,
        18.5,
        1.12,
        0.35,
        "https://cdn.aura.test/heatmap.png",
        anomalies,
        List.of("Arteriolar narrowing detected")
    );
  }

  private BatchJobItemStatusDto createItemStatus(
      String itemId,
      String pseudonymId,
      String status,
      AiInferenceResultDto aiResult
  ) {
    return new BatchJobItemStatusDto(
        itemId,
        "fundus_" + itemId + ".png",
        "OD",
        pseudonymId,
        "Patient " + itemId,
        "MRN-" + itemId,
        55,
        "Male",
        140,
        90,
        7.2,
        status,
        1200L,
        aiResult
    );
  }

  @Test
  @DisplayName("createBatchJob, getLatestBatchId, getBatchStatus cho ca tồn tại và không tồn tại")
  void createAndGetBatchStatus() {
    assertThat(queue.getLatestBatchId()).isNull();
    assertThat(queue.getBatchStatus("non-existent")).isNull();

    queue.createBatchJob("batch-101", "clinic-alpha", 10);

    assertThat(queue.getLatestBatchId()).isEqualTo("batch-101");

    BatchJobResponseDto response = queue.getBatchStatus("batch-101");
    assertThat(response).isNotNull();
    assertThat(response.batchId()).isEqualTo("batch-101");
    assertThat(response.clinicId()).isEqualTo("clinic-alpha");
    assertThat(response.totalImages()).isEqualTo(10);
    assertThat(response.processedCount()).isEqualTo(0);
    assertThat(response.failedCount()).isEqualTo(0);
    assertThat(response.status()).isEqualTo("IN_PROGRESS");
    assertThat(response.estimatedTimeRemainingSeconds()).isGreaterThan(0);
    assertThat(response.items()).isEmpty();
  }

  @Test
  @DisplayName("getAllBatches trả về danh sách các batch đã tạo sắp xếp giảm dần theo thời gian tạo")
  void getAllBatches() throws InterruptedException {
    queue.createBatchJob("batch-01", "clinic-A", 5);
    Thread.sleep(10);
    queue.createBatchJob("batch-02", "clinic-B", 10);

    List<BatchJobResponseDto> allBatches = queue.getAllBatches();
    assertThat(allBatches).hasSize(2);
    assertThat(allBatches.get(0).batchId()).isEqualTo("batch-02");
    assertThat(allBatches.get(1).batchId()).isEqualTo("batch-01");
  }

  @Test
  @DisplayName("enqueue và dequeue đưa vào và lấy ra task chính xác theo cơ chế FIFO")
  void enqueueAndDequeue() throws InterruptedException {
    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "ps-1", "ANON-MRN-1", 45, "Female", 120, 80, 5.8, false, false, Instant.now()
    );
    BatchItemTask task1 = new BatchItemTask("batch-1", "item-1", "scan1.png", "OD", patient, "base64data1");
    BatchItemTask task2 = new BatchItemTask("batch-1", "item-2", "scan2.png", "OS", patient, "base64data2");

    queue.enqueue(task1);
    queue.enqueue(task2);

    BatchItemTask dequeued1 = queue.dequeue();
    BatchItemTask dequeued2 = queue.dequeue();

    assertThat(dequeued1.itemId()).isEqualTo("item-1");
    assertThat(dequeued2.itemId()).isEqualTo("item-2");
  }

  @Test
  @DisplayName("registerItem và updateItemProgress với PROCESSING, COMPLETED, FAILED cập nhật đúng trạng thái hoàn tất")
  void registerItemAndUpdateItemProgress() {
    queue.createBatchJob("batch-prog", "clinic-C", 2);

    BatchJobItemStatusDto item1 = createItemStatus("item-1", "ps-1", "QUEUED", null);
    BatchJobItemStatusDto item2 = createItemStatus("item-2", "ps-2", "QUEUED", null);

    queue.registerItem("batch-prog", item1);
    queue.registerItem("batch-prog", item2);

    // Update item-1 to PROCESSING
    queue.updateItemProgress("batch-prog", "item-1", "PROCESSING", 0, null);
    BatchJobResponseDto statusAfterProcessing = queue.getBatchStatus("batch-prog");
    assertThat(statusAfterProcessing.items().get(0).status()).isEqualTo("PROCESSING");
    assertThat(statusAfterProcessing.status()).isEqualTo("IN_PROGRESS");

    // Update item-1 to COMPLETED
    AiInferenceResultDto aiResult1 = createAiResult(60, "Moderate", 12.0, 1);
    queue.updateItemProgress("batch-prog", "item-1", "COMPLETED", 1500L, aiResult1);
    BatchJobResponseDto statusAfterItem1 = queue.getBatchStatus("batch-prog");
    assertThat(statusAfterItem1.processedCount()).isEqualTo(1);
    assertThat(statusAfterItem1.status()).isEqualTo("IN_PROGRESS"); // Not completed yet because total is 2

    // Update item-2 to FAILED -> processed (1) + failed (1) == totalImages (2) -> batch becomes COMPLETED
    queue.updateItemProgress("batch-prog", "item-2", "FAILED", 800L, null);
    BatchJobResponseDto statusAfterItem2 = queue.getBatchStatus("batch-prog");
    assertThat(statusAfterItem2.processedCount()).isEqualTo(1);
    assertThat(statusAfterItem2.failedCount()).isEqualTo(1);
    assertThat(statusAfterItem2.status()).isEqualTo("COMPLETED");

    // Calling updateItemProgress on non-existent batch does not crash
    queue.updateItemProgress("non-existent", "item-1", "COMPLETED", 100, null);
  }

  @Test
  @DisplayName("updateItemProgress khi tất cả đều COMPLETED thì batch tự động chuyển trạng thái COMPLETED")
  void updateItemProgress_whenAllCompleted_marksBatchCompleted() {
    queue.createBatchJob("batch-all-ok", "clinic-D", 1);
    BatchJobItemStatusDto item = createItemStatus("item-ok", "ps-ok", "QUEUED", null);
    queue.registerItem("batch-all-ok", item);

    queue.updateItemProgress("batch-all-ok", "item-ok", "COMPLETED", 1000L, createAiResult(35, "Low", 5.0, 0));

    BatchJobResponseDto status = queue.getBatchStatus("batch-all-ok");
    assertThat(status.processedCount()).isEqualTo(1);
    assertThat(status.status()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("cancelBatch chuyển trạng thái batch thành CANCELLED")
  void cancelBatch() {
    queue.createBatchJob("batch-cancel", "clinic-E", 5);
    queue.cancelBatch("batch-cancel");

    BatchJobResponseDto status = queue.getBatchStatus("batch-cancel");
    assertThat(status.status()).isEqualTo("CANCELLED");

    // Non-existent batch cancel does not throw exception
    queue.cancelBatch("non-existent");
  }

  @Test
  @DisplayName("calculateRiskStatistics tính toán đúng phân bố rủi ro, điểm TB, nguy cơ đột quỵ TB")
  void calculateRiskStatistics() {
    assertThat(queue.calculateRiskStatistics("non-existent")).isNull();

    queue.createBatchJob("batch-stats", "clinic-stat", 4);

    // Item 1: Critical (score 90 >= 85)
    AiInferenceResultDto resCrit = createAiResult(90, "Critical", 28.0, 3);
    BatchJobItemStatusDto item1 = createItemStatus("i-1", "p-1", "COMPLETED", resCrit);

    // Item 2: High (score 75 >= 70)
    AiInferenceResultDto resHigh = createAiResult(75, "High", 19.0, 2);
    BatchJobItemStatusDto item2 = createItemStatus("i-2", "p-2", "COMPLETED", resHigh);

    // Item 3: Moderate (score 55 >= 40)
    AiInferenceResultDto resMod = createAiResult(55, "Moderate", 10.0, 1);
    BatchJobItemStatusDto item3 = createItemStatus("i-3", "p-3", "COMPLETED", resMod);

    // Item 4: Low (score 30 < 40)
    AiInferenceResultDto resLow = createAiResult(30, "Low", 4.0, 0);
    BatchJobItemStatusDto item4 = createItemStatus("i-4", "p-4", "COMPLETED", resLow);

    queue.registerItem("batch-stats", item1);
    queue.registerItem("batch-stats", item2);
    queue.registerItem("batch-stats", item3);
    queue.registerItem("batch-stats", item4);

    queue.updateItemProgress("batch-stats", "i-1", "COMPLETED", 1000L, resCrit);
    queue.updateItemProgress("batch-stats", "i-2", "COMPLETED", 1000L, resHigh);
    queue.updateItemProgress("batch-stats", "i-3", "COMPLETED", 1000L, resMod);
    queue.updateItemProgress("batch-stats", "i-4", "COMPLETED", 1000L, resLow);

    BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics("batch-stats");

    assertThat(stats).isNotNull();
    assertThat(stats.batchId()).isEqualTo("batch-stats");
    assertThat(stats.totalImages()).isEqualTo(4);
    assertThat(stats.processedCount()).isEqualTo(4);
    assertThat(stats.failedCount()).isEqualTo(0);
    assertThat(stats.highRiskPatientCount()).isEqualTo(2); // 1 critical + 1 high
    assertThat(stats.severeAnomaliesDetectedCount()).isEqualTo(6); // 3 + 2 + 1 + 0

    // Average score: (90 + 75 + 55 + 30) / 4 = 250 / 4 = 62.5
    assertThat(stats.averageVascularRiskScore()).isEqualTo(62.5);

    // Average stroke: (28.0 + 19.0 + 10.0 + 4.0) / 4 = 61.0 / 4 = 15.25 -> rounded to 15.3
    assertThat(stats.averageStrokeRiskPercent()).isEqualTo(15.3);

    // Distribution
    assertThat(stats.riskDistribution().criticalCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().criticalPercentage()).isEqualTo(25.0);
    assertThat(stats.riskDistribution().highCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().highPercentage()).isEqualTo(25.0);
    assertThat(stats.riskDistribution().moderateCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().moderatePercentage()).isEqualTo(25.0);
    assertThat(stats.riskDistribution().lowCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().lowPercentage()).isEqualTo(25.0);
  }

  @Test
  @DisplayName("detectAlertsAndTrends phát hiện CRITICAL alert, HIGH alert và abnormal trend khi tỷ lệ nguy cơ cao >= 20%")
  void detectAlertsAndTrends() {
    assertThat(queue.detectAlertsAndTrends("non-existent")).isNull();

    queue.createBatchJob("batch-alerts", "clinic-alert", 3);

    // Critical: score 88 >= 85, stroke 26.0 >= 25.0
    AiInferenceResultDto resCrit = createAiResult(88, "Critical", 26.0, 3);
    BatchJobItemStatusDto item1 = createItemStatus("a-1", "p-1", "COMPLETED", resCrit);

    // High: score 72 >= 70, stroke 18.5 >= 18.0
    AiInferenceResultDto resHigh = createAiResult(72, "High", 18.5, 2);
    BatchJobItemStatusDto item2 = createItemStatus("a-2", "p-2", "COMPLETED", resHigh);

    // Low: score 20
    AiInferenceResultDto resLow = createAiResult(20, "Low", 3.0, 0);
    BatchJobItemStatusDto item3 = createItemStatus("a-3", "p-3", "COMPLETED", resLow);

    queue.registerItem("batch-alerts", item1);
    queue.registerItem("batch-alerts", item2);
    queue.registerItem("batch-alerts", item3);

    BulkBatchAlertSummaryDto summary = queue.detectAlertsAndTrends("batch-alerts");

    assertThat(summary).isNotNull();
    assertThat(summary.batchId()).isEqualTo("batch-alerts");
    assertThat(summary.totalAlerts()).isEqualTo(2);
    assertThat(summary.criticalAlertsCount()).isEqualTo(1);
    assertThat(summary.warningAlertsCount()).isEqualTo(1);
    // 2 high risk out of 3 evaluated = 66.7% >= 20% with total >= 3 -> hasAbnormalTrend is true
    assertThat(summary.hasAbnormalTrend()).isTrue();
    assertThat(summary.abnormalTrendMessage()).contains("Cảnh báo xu hướng bất thường");
    assertThat(summary.alerts()).hasSize(2);
    assertThat(summary.alerts().get(0).severity()).isEqualTo("CRITICAL");
    assertThat(summary.alerts().get(1).severity()).isEqualTo("WARNING");
  }

  @Test
  @DisplayName("detectAlertsAndTrends khi tỷ lệ nguy cơ cao < 20% thì hasAbnormalTrend là false")
  void detectAlertsAndTrends_whenLowRiskRate_hasAbnormalTrendIsFalse() {
    queue.createBatchJob("batch-normal", "clinic-norm", 5);

    // 5 items, only 0 alerts (all low risk)
    for (int i = 1; i <= 5; i++) {
      AiInferenceResultDto res = createAiResult(25, "Low", 3.0, 0);
      BatchJobItemStatusDto item = createItemStatus("norm-" + i, "p-" + i, "COMPLETED", res);
      queue.registerItem("batch-normal", item);
    }

    BulkBatchAlertSummaryDto summary = queue.detectAlertsAndTrends("batch-normal");

    assertThat(summary).isNotNull();
    assertThat(summary.totalAlerts()).isEqualTo(0);
    assertThat(summary.criticalAlertsCount()).isEqualTo(0);
    assertThat(summary.warningAlertsCount()).isEqualTo(0);
    assertThat(summary.hasAbnormalTrend()).isFalse();
    assertThat(summary.abnormalTrendMessage()).isNull();
  }

  @Test
  @DisplayName("Test đầy đủ tất cả các getters và setters của BatchJobState thông qua Reflection")
  void testBatchJobStateGettersAndSetters() throws Exception {
    Class<?> stateClass = Class.forName("com.aura.bulk.queue.BatchJobQueue$BatchJobState");
    Constructor<?> ctor = stateClass.getDeclaredConstructor(
        String.class,
        String.class,
        int.class,
        AtomicInteger.class,
        AtomicInteger.class,
        String.class,
        Instant.class,
        ConcurrentHashMap.class
    );
    ctor.setAccessible(true);

    Instant now = Instant.now();
    AtomicInteger processed = new AtomicInteger(5);
    AtomicInteger failed = new AtomicInteger(1);
    ConcurrentHashMap<String, BatchJobItemStatusDto> items = new ConcurrentHashMap<>();

    Object stateInstance = ctor.newInstance(
        "batch-state-id",
        "clinic-state-id",
        10,
        processed,
        failed,
        "IN_PROGRESS",
        now,
        items
    );

    Method batchIdM = stateClass.getDeclaredMethod("batchId");
    Method clinicIdM = stateClass.getDeclaredMethod("clinicId");
    Method totalImagesM = stateClass.getDeclaredMethod("totalImages");
    Method processedCountM = stateClass.getDeclaredMethod("processedCount");
    Method failedCountM = stateClass.getDeclaredMethod("failedCount");
    Method statusM = stateClass.getDeclaredMethod("status");
    Method setStatusM = stateClass.getDeclaredMethod("setStatus", String.class);
    Method createdAtM = stateClass.getDeclaredMethod("createdAt");
    Method itemsM = stateClass.getDeclaredMethod("items");

    batchIdM.setAccessible(true);
    clinicIdM.setAccessible(true);
    totalImagesM.setAccessible(true);
    processedCountM.setAccessible(true);
    failedCountM.setAccessible(true);
    statusM.setAccessible(true);
    setStatusM.setAccessible(true);
    createdAtM.setAccessible(true);
    itemsM.setAccessible(true);

    assertThat(batchIdM.invoke(stateInstance)).isEqualTo("batch-state-id");
    assertThat(clinicIdM.invoke(stateInstance)).isEqualTo("clinic-state-id");
    assertThat(totalImagesM.invoke(stateInstance)).isEqualTo(10);
    assertThat(((AtomicInteger) processedCountM.invoke(stateInstance)).get()).isEqualTo(5);
    assertThat(((AtomicInteger) failedCountM.invoke(stateInstance)).get()).isEqualTo(1);
    assertThat(statusM.invoke(stateInstance)).isEqualTo("IN_PROGRESS");
    assertThat(createdAtM.invoke(stateInstance)).isEqualTo(now);
    assertThat(itemsM.invoke(stateInstance)).isSameAs(items);

    // Test setStatus
    setStatusM.invoke(stateInstance, "COMPLETED");
    assertThat(statusM.invoke(stateInstance)).isEqualTo("COMPLETED");
  }
}
