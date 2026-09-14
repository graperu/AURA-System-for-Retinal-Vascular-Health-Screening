package com.aura.bulk.queue;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.BatchJobItemStatusDto;
import com.aura.bulk.dto.BulkBatchAlertSummaryDto;
import com.aura.bulk.dto.BulkBatchRiskStatisticsDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@DisplayName("BatchJobQueue - Optimized Safe Zero-Division & Epidemic Alert Tests")
class BatchJobQueueOptimizedTest {

  private BatchJobQueue queue;

  @BeforeEach
  void setUp() {
    queue = new BatchJobQueue();
  }

  @Test
  @DisplayName("calculateRiskStatistics: Trả về null khi batchId không tồn tại trong bộ nhớ")
  void testCalculateRiskStatisticsNotFound() {
    BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics("non-existent-batch-id");
    assertThat(stats).isNull();
  }

  @Test
  @DisplayName("calculateRiskStatistics: Xử lý an toàn tuyệt đối khi completedCount == 0 (Tránh lỗi chia cho 0)")
  void testCalculateRiskStatisticsWhenCompletedCountIsZero() {
    String batchId = "batch-zero-completed";
    queue.createBatchJob(batchId, "clinic-01", 3);

    // Register 3 items with null aiResult (QUEUED / FAILED)
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-1", "img1.png", "OD", "P1", "QUEUED", 0, null));
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-2", "img2.png", "OS", "P2", "PROCESSING", 100, null));
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-3", "img3.png", "OD", "P3", "FAILED", 200, null));

    BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics(batchId);

    assertThat(stats).isNotNull();
    assertThat(stats.averageVascularRiskScore()).isEqualTo(0.0);
    assertThat(stats.averageStrokeRiskPercent()).isEqualTo(0.0);
    assertThat(stats.highRiskPatientCount()).isEqualTo(0);
    assertThat(stats.severeAnomaliesDetectedCount()).isEqualTo(0);

    assertThat(stats.riskDistribution().lowPercentage()).isEqualTo(0.0);
    assertThat(stats.riskDistribution().moderatePercentage()).isEqualTo(0.0);
    assertThat(stats.riskDistribution().highPercentage()).isEqualTo(0.0);
    assertThat(stats.riskDistribution().criticalPercentage()).isEqualTo(0.0);
  }

  @Test
  @DisplayName("calculateRiskStatistics: Phân loại chính xác 4 mức nguy cơ và tính trung bình có làm tròn 1 chữ số thập phân")
  void testCalculateRiskStatisticsWithMixedDistribution() {
    String batchId = "batch-mixed-risk";
    queue.createBatchJob(batchId, "clinic-01", 4);

    queue.registerItem(batchId, new BatchJobItemStatusDto("item-1", "img1.png", "OD", "P1", "COMPLETED", 150,
        createAiResult(90, "Critical", 28.0, 3))); // Critical
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-2", "img2.png", "OS", "P2", "COMPLETED", 150,
        createAiResult(75, "High", 19.0, 2)));     // High
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-3", "img3.png", "OD", "P3", "COMPLETED", 150,
        createAiResult(50, "Moderate", 10.0, 0))); // Moderate
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-4", "img4.png", "OS", "P4", "COMPLETED", 150,
        createAiResult(25, "Low", 5.0, 0)));       // Low

    BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics(batchId);

    assertThat(stats).isNotNull();
    assertThat(stats.riskDistribution().criticalCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().highCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().moderateCount()).isEqualTo(1);
    assertThat(stats.riskDistribution().lowCount()).isEqualTo(1);

    assertThat(stats.riskDistribution().criticalPercentage()).isEqualTo(25.0);
    assertThat(stats.riskDistribution().highPercentage()).isEqualTo(25.0);
    assertThat(stats.riskDistribution().moderatePercentage()).isEqualTo(25.0);
    assertThat(stats.riskDistribution().lowPercentage()).isEqualTo(25.0);

    // Sum = 90 + 75 + 50 + 25 = 240 / 4 = 60.0
    assertThat(stats.averageVascularRiskScore()).isEqualTo(60.0);
    // Stroke = 28.0 + 19.0 + 10.0 + 5.0 = 62.0 / 4 = 15.5
    assertThat(stats.averageStrokeRiskPercent()).isEqualTo(15.5);
    assertThat(stats.highRiskPatientCount()).isEqualTo(2); // High + Critical
    assertThat(stats.severeAnomaliesDetectedCount()).isEqualTo(5); // 3 + 2
  }

  @Test
  @DisplayName("detectAlertsAndTrends: Trả về null khi batchId không tồn tại")
  void testDetectAlertsAndTrendsNotFound() {
    BulkBatchAlertSummaryDto summary = queue.detectAlertsAndTrends("non-existent-batch-id");
    assertThat(summary).isNull();
  }

  @ParameterizedTest(name = "Total evaluated: {0}, High-risk count: {1} -> Abnormal trend: {2}")
  @CsvSource({
    "0, 0, false", // Không có ca nào đánh giá
    "2, 2, false", // 100% tỷ lệ nhưng totalEvaluated < 3 -> Không kích hoạt
    "2, 1, false", // 50% tỷ lệ nhưng totalEvaluated < 3 -> Không kích hoạt
    "3, 0, false", // 0% < 20% -> Không kích hoạt
    "3, 1, true",  // 33.3% >= 20% & total >= 3 -> KÍCH HOẠT
    "5, 1, true",  // 20.0% == 20% (biên chính xác) & total >= 3 -> KÍCH HOẠT
    "6, 1, false", // 16.7% < 20% -> Không kích hoạt
    "10, 2, true", // 20.0% >= 20% -> KÍCH HOẠT
    "10, 1, false" // 10.0% < 20% -> Không kích hoạt
  })
  @DisplayName("detectAlertsAndTrends: Kiểm tra điều kiện kích hoạt cảnh báo xu hướng bất thường (totalEvaluated >= 3 && highRiskRate >= 20.0)")
  void testDetectAlertsAndTrendsBoundaryMatrix(int totalEvaluated, int highRiskCount, boolean expectedTrend) {
    String batchId = "batch-trend-" + totalEvaluated + "-" + highRiskCount;
    queue.createBatchJob(batchId, "clinic-trend", totalEvaluated);

    // Thêm các ca nguy cơ cao (score 88 -> Critical alert)
    for (int i = 0; i < highRiskCount; i++) {
      queue.registerItem(batchId, new BatchJobItemStatusDto(
          "item-high-" + i, "high_" + i + ".png", "OD", "P_HIGH_" + i, "COMPLETED", 120,
          createAiResult(88, "Critical", 26.0, 3)));
    }

    // Thêm các ca nguy cơ thấp bình thường (score 30 -> Low)
    int lowRiskCount = totalEvaluated - highRiskCount;
    for (int i = 0; i < lowRiskCount; i++) {
      queue.registerItem(batchId, new BatchJobItemStatusDto(
          "item-low-" + i, "low_" + i + ".png", "OS", "P_LOW_" + i, "COMPLETED", 100,
          createAiResult(30, "Low", 5.0, 0)));
    }

    BulkBatchAlertSummaryDto summary = queue.detectAlertsAndTrends(batchId);

    assertThat(summary).isNotNull();
    assertThat(summary.hasAbnormalTrend()).isEqualTo(expectedTrend);
    if (expectedTrend) {
      assertThat(summary.abnormalTrendMessage())
          .isNotNull()
          .contains("Cảnh báo xu hướng bất thường: Tỷ lệ bệnh nhân nguy cơ cao/nghiêm trọng")
          .contains("vượt ngưỡng an toàn 20%");
    } else {
      assertThat(summary.abnormalTrendMessage()).isNull();
    }
  }

  @Test
  @DisplayName("registerItem: Xử lý an toàn khi batchId không tồn tại và hỗ trợ ghi đè khi đăng ký trùng itemId")
  void testRegisterItemOverwriteAndNullBatch() {
    // Non-existent batch
    queue.registerItem("non-existent-batch", new BatchJobItemStatusDto("item-x", "img.png", "OD", "P1", "QUEUED", 0, null));

    String batchId = "batch-register-overwrite";
    queue.createBatchJob(batchId, "clinic-01", 1);

    BatchJobItemStatusDto itemInitial = new BatchJobItemStatusDto("item-1", "img.png", "OD", "P1", "QUEUED", 0, null);
    queue.registerItem(batchId, itemInitial);

    BatchJobItemStatusDto itemOverwritten = new BatchJobItemStatusDto("item-1", "img.png", "OD", "P1", "PRE_PROCESSED", 50, null);
    queue.registerItem(batchId, itemOverwritten);

    var status = queue.getBatchStatus(batchId);
    assertThat(status).isNotNull();
    assertThat(status.items()).hasSize(1);
    assertThat(status.items().get(0).status()).isEqualTo("PRE_PROCESSED");
    assertThat(status.items().get(0).durationMs()).isEqualTo(50);
  }

  @Test
  @DisplayName("updateItemProgress: Bao phủ batch state null, existingItem null, p + f < totalImages và hoàn tất COMPLETED")
  void testUpdateItemProgressFullLifecycle() {
    // 1. Batch state null -> return an toàn
    queue.updateItemProgress("unknown-batch", "item-1", "COMPLETED", 100, null);

    // 2. Batch với 3 items
    String batchId = "batch-progress-test";
    queue.createBatchJob(batchId, "clinic-01", 3);

    // Item 1 đăng ký trong store
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-1", "img1.png", "OD", "P1", "PROCESSING", 0, null));

    // Update item 1 thành COMPLETED -> p=1, f=0, total=3 -> status vẫn là IN_PROGRESS
    queue.updateItemProgress(batchId, "item-1", "COMPLETED", 120, null);
    var status1 = queue.getBatchStatus(batchId);
    assertThat(status1.processedCount()).isEqualTo(1);
    assertThat(status1.failedCount()).isEqualTo(0);
    assertThat(status1.status()).isEqualTo("IN_PROGRESS");

    // Update item 2 (chưa từng registerItem, existingItem == null) thành FAILED -> p=1, f=1, total=3 -> vẫn IN_PROGRESS
    queue.updateItemProgress(batchId, "item-2", "FAILED", 80, null);
    var status2 = queue.getBatchStatus(batchId);
    assertThat(status2.processedCount()).isEqualTo(1);
    assertThat(status2.failedCount()).isEqualTo(1);
    assertThat(status2.status()).isEqualTo("IN_PROGRESS");

    // Update item 3 thành COMPLETED -> p=2, f=1, 2 + 1 >= 3 -> status chuyển thành COMPLETED
    queue.updateItemProgress(batchId, "item-3", "COMPLETED", 90, null);
    var status3 = queue.getBatchStatus(batchId);
    assertThat(status3.processedCount()).isEqualTo(2);
    assertThat(status3.failedCount()).isEqualTo(1);
    assertThat(status3.status()).isEqualTo("COMPLETED");

    // Test trường hợp item cuối cùng FAILED dẫn đến COMPLETED toàn batch
    String singleBatch = "batch-single-failed";
    queue.createBatchJob(singleBatch, "clinic-01", 1);
    queue.updateItemProgress(singleBatch, "single-item", "FAILED", 50, null);
    var singleStatus = queue.getBatchStatus(singleBatch);
    assertThat(singleStatus.status()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("calculateRiskStatistics & detectAlertsAndTrends: Tổ hợp nhãn 'Severe', 'Moderate', 'Critical' và các ngưỡng đột quỵ/dị thường")
  void testRiskLabelsAndThresholdCombinations() {
    String batchId = "batch-labels-thresholds";
    queue.createBatchJob(batchId, "clinic-01", 6);

    // Item A: score=30 nhưng level="Severe" -> Critical trong thống kê & cảnh báo
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-a", "a.png", "OD", "P_A", "COMPLETED", 100,
        createAiResult(30, "Severe", 10.0, 0)));

    // Item B: score=50, level="High" -> High trong thống kê & WARNING alert
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-b", "b.png", "OS", "P_B", "COMPLETED", 100,
        createAiResult(50, "High", 12.0, 0)));

    // Item C: score=40, level="Low", stroke=26.0 (>=25) -> Critical alert
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-c", "c.png", "OD", "P_C", "COMPLETED", 100,
        createAiResult(40, "Low", 26.0, 0)));

    // Item D: score=40, level="Low", stroke=19.0 (>=18) -> High alert
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-d", "d.png", "OS", "P_D", "COMPLETED", 100,
        createAiResult(40, "Low", 19.0, 0)));

    // Item E: score=40, level="Low", stroke=10.0, anomalies=2 (>=2) -> High alert
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-e", "e.png", "OD", "P_E", "COMPLETED", 100,
        createAiResult(40, "Low", 10.0, 2)));

    // Item F: score=35, level="Moderate" -> Moderate trong thống kê, không có alert
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-f", "f.png", "OS", "P_F", "COMPLETED", 100,
        createAiResult(35, "Moderate", 8.0, 0)));

    // 1. Thống kê rủi ro
    BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics(batchId);
    assertThat(stats).isNotNull();
    assertThat(stats.riskDistribution().criticalCount()).isEqualTo(1); // Item A
    assertThat(stats.riskDistribution().highCount()).isEqualTo(1);     // Item B
    assertThat(stats.riskDistribution().moderateCount()).isEqualTo(4); // C, D, E, F

    // 2. Cảnh báo khẩn cấp
    BulkBatchAlertSummaryDto alerts = queue.detectAlertsAndTrends(batchId);
    assertThat(alerts).isNotNull();
    assertThat(alerts.criticalAlertsCount()).isEqualTo(2); // Item A (Severe), Item C (stroke 26.0)
    assertThat(alerts.warningAlertsCount()).isEqualTo(3);  // Item B (High), Item D (stroke 19.0), Item E (anomalies 2)
  }

  @Test
  @DisplayName("Queue lifecycle: enqueue, dequeue, cancelBatch, getAllBatches, getLatestBatchId")
  void testQueueLifecycleMethods() throws Exception {
    String batchId = "batch-lifecycle";
    queue.createBatchJob(batchId, "clinic-01", 1);
    assertThat(queue.getLatestBatchId()).isEqualTo(batchId);

    // Cancel batch
    queue.cancelBatch(batchId);
    assertThat(queue.getBatchStatus(batchId).status()).isEqualTo("CANCELLED");

    // Non-existent cancel
    queue.cancelBatch("non-existent");

    // All batches
    var all = queue.getAllBatches();
    assertThat(all).isNotEmpty();

    // Enqueue & Dequeue
    com.aura.bulk.dto.PatientAnonymizedDto patient = new com.aura.bulk.dto.PatientAnonymizedDto(
        "anon-1", "MRN-1", 50, "Male", 120, 80, 5.5, false, false, java.time.Instant.now()
    );
    com.aura.bulk.queue.BatchItemTask task = new com.aura.bulk.queue.BatchItemTask(
        batchId, "item-task-1", "img.png", "OD", patient, "payload"
    );
    queue.enqueue(task);

    com.aura.bulk.queue.BatchItemTask dequeued = queue.dequeue();
    assertThat(dequeued.itemId()).isEqualTo("item-task-1");
  }

  @Test
  @DisplayName("registerItem: Ghi đè an toàn khi đăng ký trùng itemId và bỏ qua khi batch không tồn tại")
  void testRegisterItemDuplicateAndNotFound() {
    String batchId = "batch-dup-test";
    queue.createBatchJob(batchId, "clinic-dup", 2);

    BatchJobItemStatusDto item1 = new BatchJobItemStatusDto("item-dup-1", "img1.png", "OD", "P1", "QUEUED", 0, null);
    queue.registerItem(batchId, item1);
    assertThat(queue.getBatchStatus(batchId).items()).hasSize(1);

    // Đăng ký trùng itemId -> ghi đè dữ liệu mới
    BatchJobItemStatusDto item1Updated = new BatchJobItemStatusDto("item-dup-1", "img1_new.png", "OS", "P1_NEW", "QUEUED", 0, null);
    queue.registerItem(batchId, item1Updated);
    assertThat(queue.getBatchStatus(batchId).items()).hasSize(1);
    assertThat(queue.getBatchStatus(batchId).items().get(0).fileName()).isEqualTo("img1_new.png");

    // Đăng ký vào batch không tồn tại -> an toàn không crash
    queue.registerItem("non-existent-batch", item1);
  }

  @Test
  @DisplayName("updateItemProgress: Kiểm tra các nhánh trạng thái tiến trình, batch null và chuyển trạng thái COMPLETED")
  void testUpdateItemProgressBranches() {
    String batchId = "batch-progress-test";
    queue.createBatchJob(batchId, "clinic-prog", 3);

    BatchJobItemStatusDto item1 = new BatchJobItemStatusDto("item-1", "f1.png", "OD", "P1", "QUEUED", 0, null);
    BatchJobItemStatusDto item2 = new BatchJobItemStatusDto("item-2", "f2.png", "OS", "P2", "QUEUED", 0, null);
    BatchJobItemStatusDto item3 = new BatchJobItemStatusDto("item-3", "f3.png", "OD", "P3", "QUEUED", 0, null);
    queue.registerItem(batchId, item1);
    queue.registerItem(batchId, item2);
    queue.registerItem(batchId, item3);

    // 1. BatchId không tồn tại -> return an toàn
    queue.updateItemProgress("non-existent-batch", "item-1", "COMPLETED", 100, null);

    // 2. ItemId không tồn tại -> không cập nhật item nhưng vẫn tính bộ đếm nếu là COMPLETED
    queue.updateItemProgress(batchId, "unknown-item", "PROCESSING", 50, null);

    // 3. Item 1 COMPLETED (1/3) -> status vẫn IN_PROGRESS vì processed + failed < totalImages
    AiInferenceResultDto result1 = createAiResult(45, "Moderate", 10.0, 0);
    queue.updateItemProgress(batchId, "item-1", "COMPLETED", 120, result1);
    assertThat(queue.getBatchStatus(batchId).processedCount()).isEqualTo(1);
    assertThat(queue.getBatchStatus(batchId).status()).isEqualTo("IN_PROGRESS");
    assertThat(queue.getBatchStatus(batchId).items().get(0).status()).isEqualTo("COMPLETED");
    assertThat(queue.getBatchStatus(batchId).items().get(0).aiResult()).isEqualTo(result1);

    // 4. Item 2 FAILED (2/3) -> status vẫn IN_PROGRESS vì 1 + 1 = 2 < 3
    queue.updateItemProgress(batchId, "item-2", "FAILED", 80, null);
    assertThat(queue.getBatchStatus(batchId).failedCount()).isEqualTo(1);
    assertThat(queue.getBatchStatus(batchId).status()).isEqualTo("IN_PROGRESS");

    // 5. Item 3 FAILED (3/3) -> processed (1) + failed (2) >= 3 -> chuyển status sang COMPLETED
    queue.updateItemProgress(batchId, "item-3", "FAILED", 90, null);
    assertThat(queue.getBatchStatus(batchId).failedCount()).isEqualTo(2);
    assertThat(queue.getBatchStatus(batchId).status()).isEqualTo("COMPLETED");
  }

  @Test
  @DisplayName("updateItemProgress: Chuyển COMPLETED khi toàn bộ hoàn tất qua nhánh COMPLETED")
  void testUpdateItemProgressAllCompletedTransition() {
    String batchId = "batch-all-completed";
    queue.createBatchJob(batchId, "clinic-all", 2);

    BatchJobItemStatusDto item1 = new BatchJobItemStatusDto("it-1", "f1.png", "OD", "P1", "QUEUED", 0, null);
    BatchJobItemStatusDto item2 = new BatchJobItemStatusDto("it-2", "f2.png", "OS", "P2", "QUEUED", 0, null);
    queue.registerItem(batchId, item1);
    queue.registerItem(batchId, item2);

    queue.updateItemProgress(batchId, "it-1", "COMPLETED", 100, createAiResult(30, "Low", 5.0, 0));
    assertThat(queue.getBatchStatus(batchId).status()).isEqualTo("IN_PROGRESS");

    queue.updateItemProgress(batchId, "it-2", "COMPLETED", 100, createAiResult(35, "Low", 6.0, 0));
    assertThat(queue.getBatchStatus(batchId).status()).isEqualTo("COMPLETED");
  }

  @ParameterizedTest(name = "Score {0}, Level {1} -> Expected Critical {2}, High {3}, Moderate {4}, Low {5}")
  @CsvSource({
    "30, 'Severe', 1, 0, 0, 0",
    "30, 'Critical', 1, 0, 0, 0",
    "80, 'Low', 1, 0, 0, 0",
    "85, 'Low', 1, 0, 0, 0",
    "30, 'High', 0, 1, 0, 0",
    "65, 'Low', 0, 1, 0, 0",
    "70, 'Low', 0, 1, 0, 0",
    "30, 'Moderate', 0, 0, 1, 0",
    "40, 'Low', 0, 0, 1, 0",
    "20, 'Low', 0, 0, 0, 1"
  })
  @DisplayName("calculateRiskStatistics: Bao phủ toàn bộ các ngưỡng nhãn Severe, Critical, High, Moderate và Low")
  void testCalculateRiskStatisticsLabelThresholds(int score, String level, int expCrit, int expHigh, int expMod, int expLow) {
    String batchId = "batch-thresh-" + score + "-" + level;
    queue.createBatchJob(batchId, "clinic-thresh", 1);
    queue.registerItem(batchId, new BatchJobItemStatusDto("item-th", "f.png", "OD", "P", "COMPLETED", 100,
        createAiResult(score, level, 10.0, 0)));

    BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics(batchId);
    assertThat(stats).isNotNull();
    assertThat(stats.riskDistribution().criticalCount()).isEqualTo(expCrit);
    assertThat(stats.riskDistribution().highCount()).isEqualTo(expHigh);
    assertThat(stats.riskDistribution().moderateCount()).isEqualTo(expMod);
    assertThat(stats.riskDistribution().lowCount()).isEqualTo(expLow);
  }

  private AiInferenceResultDto createAiResult(int score, String level, double strokeRisk, int anomalies) {
    return new AiInferenceResultDto(
        "analysis-" + score,
        120L,
        score,
        score,
        level,
        20,
        "No_DR",
        strokeRisk,
        0.65,
        45.0,
        1.25,
        0.3,
        "http://heatmap.url/overlay.png",
        anomalies,
        List.of("Microaneurysm detected", "Vascular narrowing")
    );
  }
}
