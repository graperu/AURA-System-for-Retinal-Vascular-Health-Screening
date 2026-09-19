package com.aura.bulk.queue;

import com.aura.bulk.dto.*;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.PatientAnonymizerService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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

    private static final Logger log = LoggerFactory.getLogger(BatchJobQueue.class);

    private final LinkedBlockingQueue<BatchItemTask> taskQueue = new LinkedBlockingQueue<>(5000);
    private final ConcurrentHashMap<String, BatchJobState> batchStore = new ConcurrentHashMap<>();
    private volatile String latestBatchId = null;

    private final BulkScreeningBatchRepository batchRepository;
    private final BulkScreeningItemRepository itemRepository;
    private final PatientAnonymizerService anonymizerService;
    private final com.aura.billing.service.BillingService billingService;

    public BatchJobQueue() {
        this(null, null, null, null);
    }

    @Autowired
    public BatchJobQueue(
            @Autowired(required = false) BulkScreeningBatchRepository batchRepository,
            @Autowired(required = false) BulkScreeningItemRepository itemRepository,
            @Autowired(required = false) PatientAnonymizerService anonymizerService,
            @Autowired(required = false) com.aura.billing.service.BillingService billingService) {
        this.batchRepository = batchRepository;
        this.itemRepository = itemRepository;
        this.anonymizerService = anonymizerService;
        this.billingService = billingService;
    }

    /**
     * DAT-03 FIX: Phục hồi trạng thái hàng đợi và các tác vụ bị gián đoạn từ PostgreSQL khi khởi động lại
     */
    @PostConstruct
    public void recoverStateOnStartup() {
        if (batchRepository == null || itemRepository == null) {
            log.info("[BatchJobQueue] PostgreSQL repositories not wired; running in standalone mode.");
            return;
        }
        try {
            List<BulkScreeningBatch> dbBatches = batchRepository.findAll();
            log.info("[BatchJobQueue] DAT-03: Scanning {} bulk screening batches from PostgreSQL for recovery...", dbBatches.size());

            for (BulkScreeningBatch batch : dbBatches) {
                String batchCode = batch.getBatchCode();
                if (batchCode == null) continue;
                List<BulkScreeningItem> dbItems = itemRepository.findByBatchIdOrderByCreatedAtAsc(batch.getId());

                BatchJobState state = new BatchJobState(
                        batchCode,
                        batch.getClinicId() != null ? batch.getClinicId().toString() : "unknown",
                        batch.getTotalImages(),
                        new AtomicInteger(batch.getProcessedCount() != null ? batch.getProcessedCount() : 0),
                        new AtomicInteger(batch.getFailedCount() != null ? batch.getFailedCount() : 0),
                        batch.getStatus(),
                        batch.getCreatedAt() != null ? batch.getCreatedAt() : Instant.now(),
                        new ConcurrentHashMap<>()
                );

                for (BulkScreeningItem item : dbItems) {
                    BatchJobItemStatusDto itemDto = toItemStatusDto(item);
                    state.items().put(item.getItemCode(), itemDto);

                    if ("IN_PROGRESS".equals(batch.getStatus()) || "QUEUED".equals(batch.getStatus())) {
                        if ("QUEUED".equals(item.getStatus()) || "PROCESSING".equals(item.getStatus())) {
                            resumeItemTask(batch, item);
                        }
                    }
                }

                batchStore.put(batchCode, state);
                this.latestBatchId = batchCode;
            }
            log.info("[BatchJobQueue] DAT-03: Successfully recovered {} batches from PostgreSQL.", batchStore.size());
        } catch (Exception ex) {
            log.error("[BatchJobQueue] DAT-03: Error recovering batch queue state from PostgreSQL: {}", ex.getMessage(), ex);
        }
    }

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
            state = loadBatchFromDatabase(batchId);
        }
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
        if (batchRepository != null) {
            try {
                List<BulkScreeningBatch> allDb = batchRepository.findAll();
                for (BulkScreeningBatch b : allDb) {
                    if (b.getBatchCode() != null && !batchStore.containsKey(b.getBatchCode())) {
                        loadBatchFromDatabase(b.getBatchCode());
                    }
                }
            } catch (Exception ex) {
                log.warn("[BatchJobQueue] Could not refresh batches from PostgreSQL: {}", ex.getMessage());
            }
        }
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
        if (batchRepository != null) {
            try {
                batchRepository.findByBatchCode(batchId).ifPresent(b -> {
                    b.setStatus("CANCELLED");
                    batchRepository.save(b);
                });
            } catch (Exception ex) {
                log.error("[BatchJobQueue] Could not sync CANCELLED status to PostgreSQL: {}", ex.getMessage());
            }
        }
    }

    /**
     * [FR-25] Calculates aggregated risk statistics and distribution across all screened patients in a batch.
     */
    public BulkBatchRiskStatisticsDto calculateRiskStatistics(String batchId) {
        BatchJobState state = batchStore.get(batchId);
        if (state == null) {
            state = loadBatchFromDatabase(batchId);
        }
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
                if (score >= 80 || "Critical".equalsIgnoreCase(level) || "Severe".equalsIgnoreCase(level)) {
                    critical++;
                } else if (score >= 65 || "High".equalsIgnoreCase(level)) {
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
            state = loadBatchFromDatabase(batchId);
        }
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

                boolean isCritical = score >= 80
                        || "Critical".equalsIgnoreCase(level)
                        || "Severe".equalsIgnoreCase(level)
                        || stroke >= 25.0;

                boolean isHigh = !isCritical && (score >= 65
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

    private synchronized BatchJobState loadBatchFromDatabase(String batchId) {
        if (batchRepository == null || itemRepository == null) {
            return null;
        }
        try {
            Optional<BulkScreeningBatch> batchOpt = batchRepository.findByBatchCode(batchId);
            if (batchOpt.isEmpty()) {
                return null;
            }
            BulkScreeningBatch batch = batchOpt.get();
            List<BulkScreeningItem> items = itemRepository.findByBatchIdOrderByCreatedAtAsc(batch.getId());

            BatchJobState state = new BatchJobState(
                    batch.getBatchCode(),
                    batch.getClinicId() != null ? batch.getClinicId().toString() : "unknown",
                    batch.getTotalImages(),
                    new AtomicInteger(batch.getProcessedCount() != null ? batch.getProcessedCount() : 0),
                    new AtomicInteger(batch.getFailedCount() != null ? batch.getFailedCount() : 0),
                    batch.getStatus(),
                    batch.getCreatedAt() != null ? batch.getCreatedAt() : Instant.now(),
                    new ConcurrentHashMap<>()
            );
            for (BulkScreeningItem it : items) {
                state.items().put(it.getItemCode(), toItemStatusDto(it));
            }
            batchStore.put(batch.getBatchCode(), state);
            return state;
        } catch (Exception ex) {
            log.warn("[BatchJobQueue] Could not load batch {} from PostgreSQL: {}", batchId, ex.getMessage());
            return null;
        }
    }

    private void resumeItemTask(BulkScreeningBatch batch, BulkScreeningItem item) {
        try {
            if (item.getImagePayload() != null && !item.getImagePayload().isBlank()) {
                PatientAnonymizedDto anonymized = anonymizerService != null
                        ? anonymizerService.anonymizePatient(
                                item.getRawMrn(), item.getPatientName(),
                                item.getPatientAge() != null ? item.getPatientAge() : 0,
                                item.getPatientGender() != null ? item.getPatientGender() : "Other",
                                item.getSystolicBp() != null ? item.getSystolicBp() : 120,
                                item.getDiastolicBp() != null ? item.getDiastolicBp() : 80,
                                item.getHba1c() != null ? item.getHba1c() : 5.7
                        )
                        : new PatientAnonymizedDto(
                                item.getPseudonymPatientId(), item.getRawMrn(),
                                item.getPatientAge() != null ? item.getPatientAge() : 0,
                                item.getPatientGender() != null ? item.getPatientGender() : "Other",
                                item.getSystolicBp() != null ? item.getSystolicBp() : 120,
                                item.getDiastolicBp() != null ? item.getDiastolicBp() : 80,
                                item.getHba1c() != null ? item.getHba1c() : 5.7,
                                false, false, Instant.now()
                        );

                BatchItemTask task = new BatchItemTask(
                        batch.getBatchCode(),
                        item.getItemCode(),
                        item.getFileName(),
                        item.getEyePosition(),
                        anonymized,
                        item.getImagePayload()
                );
                this.enqueue(task);
                log.info("[BatchJobQueue] DAT-03: Re-enqueued interrupted task {} for Batch {}", item.getItemCode(), batch.getBatchCode());
            } else {
                item.setStatus("FAILED");
                item.setErrorMessage("Tiến trình bị gián đoạn do khởi động lại hệ thống.");
                itemRepository.save(item);
            }
        } catch (Exception ex) {
            log.error("[BatchJobQueue] DAT-03: Failed to re-enqueue task {}: {}", item.getItemCode(), ex.getMessage());
        }
    }

    private BatchJobItemStatusDto toItemStatusDto(BulkScreeningItem item) {
        AiInferenceResultDto ai = null;
        if ("COMPLETED".equals(item.getStatus()) && item.getRiskScore() != null) {
            String level = item.getRiskLevel() != null ? item.getRiskLevel() : "Low";
            ai = new AiInferenceResultDto(
                    item.getId() != null ? item.getId().toString() : item.getItemCode(),
                    item.getDurationMs() != null ? item.getDurationMs() : 0L,
                    item.getRiskScore(),
                    item.getRiskScore(),
                    level,
                    (int) Math.round(item.getRiskScore() * 0.8),
                    level,
                    item.getRiskScore() * 0.25,
                    0.65,
                    18.0,
                    1.1,
                    0.35,
                    null,
                    0,
                    item.getFindings() != null ? List.of(item.getFindings().split(";\\s*")) : List.of()
            );
        }
        return new BatchJobItemStatusDto(
                item.getItemCode(),
                item.getFileName(),
                item.getEyePosition(),
                item.getPseudonymPatientId(),
                item.getPatientName(),
                item.getRawMrn(),
                item.getPatientAge() != null ? item.getPatientAge() : 0,
                item.getPatientGender(),
                item.getSystolicBp() != null ? item.getSystolicBp() : 120,
                item.getDiastolicBp() != null ? item.getDiastolicBp() : 80,
                item.getHba1c() != null ? item.getHba1c() : 5.7,
                item.getStatus(),
                item.getDurationMs() != null ? item.getDurationMs() : 0L,
                ai
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
