package com.aura.bulk.worker;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Background worker component running a continuous queue consumer loop.
 * Executes PyTorch AI inference calls with 10-20s per-image execution timing (NFR-2).
 * Synchronizes screening item and batch status into PostgreSQL.
 */
@Component
public class BulkProcessingWorker implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BulkProcessingWorker.class);

    private final BatchJobQueue jobQueue;
    private final AiServiceClient aiServiceClient;
    private final BulkScreeningItemRepository itemRepository;
    private final BulkScreeningBatchRepository batchRepository;
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    @Autowired
    public BulkProcessingWorker(
            BatchJobQueue jobQueue,
            AiServiceClient aiServiceClient,
            BulkScreeningItemRepository itemRepository,
            BulkScreeningBatchRepository batchRepository) {
        this.jobQueue = jobQueue;
        this.aiServiceClient = aiServiceClient;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
    }

    public BulkProcessingWorker(BatchJobQueue jobQueue, AiServiceClient aiServiceClient) {
        this(jobQueue, aiServiceClient, null, null);
    }

    @Override
    public void run(String... args) {
        log.info("[Bulk Processing Worker Java] Starting 4 parallel background queue consumer threads...");
        for (int i = 0; i < 4; i++) {
            executorService.submit(this::processQueueLoop);
        }
    }

    private void processQueueLoop() {
        while (!Thread.currentThread().isInterrupted()) {
            BatchItemTask task = null;
            try {
                task = jobQueue.dequeue();

                log.info("[Bulk Worker Java] Processing item {} for Batch {} (Patient Pseudonym: {})...",
                        task.itemId(), task.batchId(), task.anonymizedPatient().pseudonymId());

                jobQueue.updateItemProgress(task.batchId(), task.itemId(), "PROCESSING", 0, null);

                long startTime = System.currentTimeMillis();

                AiInferenceResultDto result = aiServiceClient.executeFundusAnalysis(
                        task.anonymizedPatient().pseudonymId(),
                        task.eyePosition(),
                        task.base64ImagePayload()
                );

                long elapsedMs = System.currentTimeMillis() - startTime;

                log.info("[Bulk Worker Java] Completed AI analysis for item {} in {}ms. Overall Risk Score: {}/100",
                        task.itemId(), elapsedMs, result.overallVascularRiskScore());

                jobQueue.updateItemProgress(task.batchId(), task.itemId(), "COMPLETED", elapsedMs, result);
                syncItemAndBatchSuccess(task, elapsedMs, result);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("[Bulk Worker Java] Error executing AI analysis task", e);
                if (task != null) {
                    try {
                        jobQueue.updateItemProgress(task.batchId(), task.itemId(), "FAILED", 0, null);
                    } catch (Exception queueEx) {
                        log.warn("[Bulk Worker Java] Could not update in-memory jobQueue progress to FAILED: {}", queueEx.getMessage());
                    }
                    syncItemAndBatchFailure(task, e);
                }
            }
        }
        log.info("[Bulk Processing Worker Java] Background worker thread stopped.");
    }

    private synchronized void syncItemAndBatchSuccess(BatchItemTask task, long elapsedMs, AiInferenceResultDto result) {
        if (batchRepository == null || itemRepository == null) {
            return;
        }
        try {
            Optional<BulkScreeningBatch> batchOpt = batchRepository.findByBatchCode(task.batchId());
            if (batchOpt.isEmpty()) {
                log.warn("[Bulk Worker Java] Batch {} not found in database for sync", task.batchId());
                return;
            }
            BulkScreeningBatch batch = batchOpt.get();

            Optional<BulkScreeningItem> itemOpt = itemRepository.findByBatchIdAndItemCode(batch.getId(), task.itemId());
            if (itemOpt.isPresent()) {
                BulkScreeningItem item = itemOpt.get();
                item.setStatus("COMPLETED");
                item.setDurationMs(elapsedMs);
                item.setRiskScore(result.overallVascularRiskScore());
                item.setRiskLevel(determineRiskLevel(result));
                item.setFindings(result.xaiRationales() != null ? String.join("; ", result.xaiRationales()) : null);
                item.setErrorMessage(null);
                item.setProcessedAt(Instant.now());
                itemRepository.save(item);
            }

            int processed = batch.getProcessedCount() != null ? batch.getProcessedCount() + 1 : 1;
            int failed = batch.getFailedCount() != null ? batch.getFailedCount() : 0;
            int total = batch.getTotalImages() != null ? batch.getTotalImages() : 0;

            batch.setProcessedCount(processed);
            if (processed + failed >= total) {
                batch.setStatus("COMPLETED");
            } else if ("QUEUED".equals(batch.getStatus())) {
                batch.setStatus("IN_PROGRESS");
            }
            batchRepository.save(batch);
        } catch (Exception ex) {
            log.error("[Bulk Worker Java] Failed to sync COMPLETED item {} to PostgreSQL: {}", task.itemId(), ex.getMessage());
        }
    }

    private synchronized void syncItemAndBatchFailure(BatchItemTask task, Exception e) {
        if (batchRepository == null || itemRepository == null) {
            return;
        }
        try {
            Optional<BulkScreeningBatch> batchOpt = batchRepository.findByBatchCode(task.batchId());
            if (batchOpt.isEmpty()) {
                log.warn("[Bulk Worker Java] Batch {} not found in database for error sync", task.batchId());
                return;
            }
            BulkScreeningBatch batch = batchOpt.get();

            Optional<BulkScreeningItem> itemOpt = itemRepository.findByBatchIdAndItemCode(batch.getId(), task.itemId());
            if (itemOpt.isPresent()) {
                BulkScreeningItem item = itemOpt.get();
                item.setStatus("FAILED");
                item.setErrorMessage(e.getMessage() != null ? e.getMessage() : "Unknown AI processing error");
                item.setProcessedAt(Instant.now());
                itemRepository.save(item);
            }

            int processed = batch.getProcessedCount() != null ? batch.getProcessedCount() : 0;
            int failed = batch.getFailedCount() != null ? batch.getFailedCount() + 1 : 0;

            batch.setFailedCount(failed);
            if (processed + failed >= totalImagesOf(batch)) {
                batch.setStatus("COMPLETED");
            } else if ("QUEUED".equals(batch.getStatus())) {
                batch.setStatus("IN_PROGRESS");
            }
            batchRepository.save(batch);
        } catch (Exception ex) {
            log.error("[Bulk Worker Java] Failed to sync FAILED item {} to PostgreSQL: {}", task.itemId(), ex.getMessage());
        }
    }

    private int totalImagesOf(BulkScreeningBatch batch) {
        return batch.getTotalImages() != null ? batch.getTotalImages() : 0;
    }

    private String determineRiskLevel(AiInferenceResultDto result) {
        int score = result.overallVascularRiskScore();
        String level = result.cardiovascularRiskLevel();
        if (score >= 80 || "Critical".equalsIgnoreCase(level) || "Severe".equalsIgnoreCase(level)) {
            return "CRITICAL";
        } else if (score >= 65 || "High".equalsIgnoreCase(level)) {
            return "HIGH";
        } else if (score >= 40 || "Moderate".equalsIgnoreCase(level)) {
            return "MODERATE";
        } else {
            return "LOW";
        }
    }
}
