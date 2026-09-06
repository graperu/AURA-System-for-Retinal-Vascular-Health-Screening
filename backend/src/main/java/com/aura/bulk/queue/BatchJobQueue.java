package com.aura.bulk.queue;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.BatchJobItemStatusDto;
import com.aura.bulk.dto.BatchJobResponseDto;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe queue manager powered by LinkedBlockingQueue and ConcurrentHashMap.
 * Manages bulk screening batch jobs (≥100 images) and progress metrics.
 */
@Component
public class BatchJobQueue {

    private final LinkedBlockingQueue<BatchItemTask> taskQueue = new LinkedBlockingQueue<>(5000);
    private final ConcurrentHashMap<String, BatchJobState> batchStore = new ConcurrentHashMap<>();

    public void enqueue(BatchItemTask task) throws InterruptedException {
        taskQueue.put(task);
    }

    public BatchItemTask dequeue() throws InterruptedException {
        return taskQueue.take();
    }

    public void createBatchJob(String batchId, String clinicId, int totalImages) {
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
        double estRemainingSeconds = Math.max(0, remaining * 14.0);

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
