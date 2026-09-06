package com.aura.bulk.worker;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.service.AiServiceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Background worker component running a continuous queue consumer loop.
 * Executes PyTorch AI inference calls with 10-20s per-image execution timing (NFR-2).
 */
@Component
public class BulkProcessingWorker implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BulkProcessingWorker.class);

    private final BatchJobQueue jobQueue;
    private final AiServiceClient aiServiceClient;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    public BulkProcessingWorker(BatchJobQueue jobQueue, AiServiceClient aiServiceClient) {
        this.jobQueue = jobQueue;
        this.aiServiceClient = aiServiceClient;
    }

    @Override
    public void run(String... args) {
        log.info("[Bulk Processing Worker Java] Starting background queue consumer thread...");
        executorService.submit(this::processQueueLoop);
    }

    private void processQueueLoop() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                BatchItemTask task = jobQueue.dequeue();

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

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("[Bulk Worker Java] Error executing AI analysis task", e);
            }
        }
        log.info("[Bulk Processing Worker Java] Background worker thread stopped.");
    }
}
