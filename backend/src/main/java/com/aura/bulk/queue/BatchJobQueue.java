package com.aura.bulk.queue;

import com.aura.bulk.dto.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe queue manager powered by LinkedBlockingQueue and ConcurrentHashMap.
 * Manages bulk screening batch jobs (>=100 images), progress metrics,
 * aggregated risk statistics (FR-25), and emergency alerts (FR-29).
 */
@Component
public class BatchJobQueue {

    private final LinkedBlockingQueue<BatchItemTask> taskQueue = new LinkedBlockingQueue<>(5000);
    private final ConcurrentHashMap<String, BatchJobState> batchStore = new ConcurrentHashMap<>();
    private volatile String latestBatchId = null;

    public void enqueue(BatchItemTask task) throws InterruptedException {
        taskQueue.put(task);
    }

    public BatchItemTask dequeue() throws InterruptedException {
        return taskQueue.take();
    }

    public String getLatestBatchId() {
        return latestBatchId;
    }

    public void createBatchJob(String batchId, String clinicId, int totalImages) {
        this.latestBatchId = batchId;
        BatchJobState state = new BatchJobState(
                batchId,
                clinicId,
                totalImages,
                new AtomicInteger(0),
                new AtomicInteger(0),
                "IN_PROGRESS",
                Instant.now(),
                new ConcurrentHashMap<>()
        );
        batchStore.put(batchId, state);
    }

    public BatchJobResponseDto getBatchStatus(String batchId) {
        BatchJobState state = batchStore.get(batchId);
        if (state == null) {
            return null;
        }

        int processed = state.processedCount().get();
        int failed = state.failedCount().get();
        int remaining = state.totalImages() - processed - failed;
        double estRemainingSeconds = Math.max(0, Math.ceil(remaining * 0.03));

        List<BatchJobItemStatusDto> itemsList = state.items().values().stream()
                .sorted(Comparator.comparing(BatchJobItemStatusDto::itemId))
                .toList();

        return new BatchJobResponseDto(
                state.batchId(),
                state.clinicId(),
                state.totalImages(),
                processed,
                failed,
                state.status(),
                state.createdAt(),
                estRemainingSeconds,
                itemsList
        );
    }

    public List<BatchJobResponseDto> getAllBatches() {
        return batchStore.values().stream()
                .sorted((a, b) -> b.createdAt().compareTo(a.createdAt()))
                .map(state -> getBatchStatus(state.batchId()))
                .toList();
    }

    public void updateItemProgress(
            String batchId,
            String itemId,
            String status,
            long durationMs,
            AiInferenceResultDto result) {
        
        BatchJobState state = batchStore.get(batchId);
        if (state == null) return;

        BatchJobItemStatusDto existingItem = state.items().get(itemId);
        if (existingItem != null) {
            BatchJobItemStatusDto updatedItem = new BatchJobItemStatusDto(
                    existingItem.itemId(),
                    existingItem.fileName(),
                    existingItem.eyePosition(),
                    existingItem.pseudonymPatientId(),
                    existingItem.patientName(),
                    existingItem.rawMrn(),
                    existingItem.patientAge(),
                    existingItem.patientGender(),
                    existingItem.systolicBp(),
                    existingItem.diastolicBp(),
                    existingItem.hbA1c(),
                    status,
                    durationMs,
                    result != null ? result : existingItem.aiResult()
            );
            state.items().put(itemId, updatedItem);
        }

        if ("COMPLETED".equals(status)) {
            int p = state.processedCount().incrementAndGet();
            if (p + state.failedCount().get() >= state.totalImages()) {
                state.setStatus("COMPLETED");
            }
        } else if ("FAILED".equals(status)) {
            int f = state.failedCount().incrementAndGet();
            if (state.processedCount().get() + f >= state.totalImages()) {
                state.setStatus("COMPLETED");
            }
        }
    }

    public void registerItem(String batchId, BatchJobItemStatusDto itemStatus) {
        BatchJobState state = batchStore.get(batchId);
        if (state != null) {
            state.items().put(itemStatus.itemId(), itemStatus);
        }
    }

    public void cancelBatch(String batchId) {
        BatchJobState state = batchStore.get(batchId);
        if (state != null) {
            state.setStatus("CANCELLED");
        }
    }

    /**
     * [FR-25] Calculates aggregated risk statistics and distribution across all screened patients in a batch.
     */
    public BulkBatchRiskStatisticsDto calculateRiskStatistics(String batchId) {
        BatchJobState state = batchStore.get(batchId);
        if (state == null) {
            return null;
        }

        int processed = state.processedCount().get();
        int failed = state.failedCount().get();
        int pending = Math.max(0, state.totalImages() - processed - failed);

        int low = 0;
        int moderate = 0;
        int high = 0;
        int critical = 0;

        double sumScore = 0.0;
        double sumStroke = 0.0;
        int completedCount = 0;
        int severeAnomalies = 0;

        for (BatchJobItemStatusDto item : state.items().values()) {
            AiInferenceResultDto ai = item.aiResult();
            if (ai != null) {
                completedCount++;
                int score = ai.overallVascularRiskScore();
                sumScore += score;
                sumStroke += ai.threeYearStrokeRiskPercent();
                severeAnomalies += ai.detectedAnomaliesCount();

                String level = ai.cardiovascularRiskLevel();
                if (score >= 85 || "Critical".equalsIgnoreCase(level) || "Severe".equalsIgnoreCase(level)) {
                    critical++;
                } else if (score >= 70 || "High".equalsIgnoreCase(level)) {
                    high++;
                } else if (score >= 40 || "Moderate".equalsIgnoreCase(level)) {
                    moderate++;
                } else {
                    low++;
                }
            }
        }

        double lowPct = completedCount > 0 ? Math.round((low * 1000.0 / completedCount)) / 10.0 : 0.0;
        double modPct = completedCount > 0 ? Math.round((moderate * 1000.0 / completedCount)) / 10.0 : 0.0;
        double highPct = completedCount > 0 ? Math.round((high * 1000.0 / completedCount)) / 10.0 : 0.0;
        double critPct = completedCount > 0 ? Math.round((critical * 1000.0 / completedCount)) / 10.0 : 0.0;

        RiskDistributionDto distribution = new RiskDistributionDto(
                low, lowPct,
                moderate, modPct,
                high, highPct,
                critical, critPct
        );

        double avgScore = completedCount > 0 ? Math.round((sumScore / completedCount) * 10.0) / 10.0 : 0.0;
        double avgStroke = completedCount > 0 ? Math.round((sumStroke / completedCount) * 10.0) / 10.0 : 0.0;

        return new BulkBatchRiskStatisticsDto(
                state.batchId(),
                state.clinicId(),
                state.totalImages(),
                processed,
                failed,
                pending,
                avgScore,
                avgStroke,
                (high + critical),
                severeAnomalies,
                distribution,
                Instant.now()
        );
    }

    /**
     * [FR-29] Identifies high-risk patients with severe vascular abnormalities and evaluates abnormal trends.
     */
    public BulkBatchAlertSummaryDto detectAlertsAndTrends(String batchId) {
        BatchJobState state = batchStore.get(batchId);
        if (state == null) {
            return null;
        }

        List<BulkBatchAlertDto> alerts = new ArrayList<>();
        int criticalCount = 0;
        int warningCount = 0;
        int totalEvaluated = 0;

        for (BatchJobItemStatusDto item : state.items().values()) {
            AiInferenceResultDto ai = item.aiResult();
            if (ai != null) {
                totalEvaluated++;
                int score = ai.overallVascularRiskScore();
                double stroke = ai.threeYearStrokeRiskPercent();
                int anomalies = ai.detectedAnomaliesCount();
                String level = ai.cardiovascularRiskLevel();

                boolean isCritical = score >= 85
                        || "Critical".equalsIgnoreCase(level)
                        || "Severe".equalsIgnoreCase(level)
                        || stroke >= 25.0;

                boolean isHigh = !isCritical && (score >= 70
                        || "High".equalsIgnoreCase(level)
                        || stroke >= 18.0
                        || anomalies >= 2);

                if (isCritical || isHigh) {
                    String severity = isCritical ? "CRITICAL" : "WARNING";
                    String riskLevel = isCritical ? "Critical" : "High";
                    String title = isCritical
                            ? "CẢNH BÁO KHẨN CẤP: Nguy cơ tổn thương vi mạch võng mạc nghiêm trọng"
                            : "CẢNH BÁO NGUY CƠ CAO: Phát hiện bất thường mạch máu võng mạc";

                    String reason = String.format(java.util.Locale.US, 
                            "Điểm nguy cơ: %d/100 | Nguy cơ đột quỵ 3 năm: %.1f%% | %d dấu hiệu tổn thương vi mạch (Tỷ số Đ/T mạch A/V: %.2f, Độ ngoằn ngoèo: %.2f)",
                            score, stroke, anomalies, ai.arteryVeinRatio(), ai.tortuosityIndex()
                    );

                    String action = isCritical
                            ? "Yêu cầu kích hoạt chuyển tuyến khẩn cấp hoặc phân công bác sĩ chuyên khoa mắt hội chẩn trong vòng 24 giờ."
                            : "Đề xuất ưu tiên bác sĩ duyệt hồ sơ CDS và lên lịch kiểm tra huyết áp/tim mạch chuyên sâu.";

                    alerts.add(new BulkBatchAlertDto(
                            "ALERT-" + item.itemId(),
                            batchId,
                            item.itemId(),
                            item.pseudonymPatientId(),
                            riskLevel,
                            score,
                            severity,
                            title,
                            reason,
                            stroke,
                            anomalies,
                            action,
                            Instant.now()
                    ));

                    if (isCritical) {
                        criticalCount++;
                    } else {
                        warningCount++;
                    }
                }
            }
        }

        // Sort alerts by risk score descending
        alerts.sort((a, b) -> Integer.compare(b.riskScore(), a.riskScore()));

        int totalHighRisk = criticalCount + warningCount;
        double highRiskRate = totalEvaluated > 0 ? (totalHighRisk * 100.0 / totalEvaluated) : 0.0;
        boolean hasAbnormalTrend = (totalEvaluated >= 3 && highRiskRate >= 20.0);

        String trendMsg = hasAbnormalTrend
                ? String.format(java.util.Locale.US, "Cảnh báo xu hướng bất thường: Tỷ lệ bệnh nhân nguy cơ cao/nghiêm trọng trong chiến dịch đạt %.1f%% (vượt ngưỡng an toàn 20%%). Cần kích hoạt quy trình can thiệp toàn diện.", highRiskRate)
                : null;

        return new BulkBatchAlertSummaryDto(
                state.batchId(),
                state.clinicId(),
                alerts.size(),
                criticalCount,
                warningCount,
                hasAbnormalTrend,
                trendMsg,
                alerts
        );
    }

    private static class BatchJobState {
        private final String batchId;
        private final String clinicId;
        private final int totalImages;
        private final AtomicInteger processedCount;
        private final AtomicInteger failedCount;
        private String status;
        private final Instant createdAt;
        private final ConcurrentHashMap<String, BatchJobItemStatusDto> items;

        public BatchJobState(
                String batchId,
                String clinicId,
                int totalImages,
                AtomicInteger processedCount,
                AtomicInteger failedCount,
                String status,
                Instant createdAt,
                ConcurrentHashMap<String, BatchJobItemStatusDto> items) {
            this.batchId = batchId;
            this.clinicId = clinicId;
            this.totalImages = totalImages;
            this.processedCount = processedCount;
            this.failedCount = failedCount;
            this.status = status;
            this.createdAt = createdAt;
            this.items = items;
        }

        public String batchId() { return batchId; }
        public String clinicId() { return clinicId; }
        public int totalImages() { return totalImages; }
        public AtomicInteger processedCount() { return processedCount; }
        public AtomicInteger failedCount() { return failedCount; }
        public String status() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Instant createdAt() { return createdAt; }
        public ConcurrentHashMap<String, BatchJobItemStatusDto> items() { return items; }
    }
}
