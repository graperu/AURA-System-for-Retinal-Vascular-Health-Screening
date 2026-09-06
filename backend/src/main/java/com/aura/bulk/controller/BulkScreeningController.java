package com.aura.bulk.controller;

import com.aura.bulk.dto.*;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.service.PatientAnonymizerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;

/**
 * RESTful Web API Controller for Bulk Retinal Fundus Screening (≥100 images batch processing).
 * Built with Spring Boot 3 & Java 21, providing HIPAA NFR-9/NFR-10 anonymization and Swagger OpenAPI docs.
 */
@RestController
@RequestMapping("/api/v1/bulk-screening")
@Tag(name = "Bulk Screening API", description = "Endpoints for bulk fundus image batch screening and real-time status polling")
@CrossOrigin(origins = "*")
public class BulkScreeningController {

    private static final Logger log = LoggerFactory.getLogger(BulkScreeningController.class);

    private final PatientAnonymizerService anonymizerService;
    private final BatchJobQueue jobQueue;

    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue) {
        this.anonymizerService = anonymizerService;
        this.jobQueue = jobQueue;
    }

    /**
     * Uploads and enqueues a bulk batch of fundus images (≥100 images) for AI vascular screening.
     */
    @PostMapping("/batch")
    @Operation(
            summary = "Bulk Upload & Queue Fundus Images (≥100 Images)",
            description = "HIPAA NFR-9/NFR-10 Compliance: Patient PHI is automatically anonymized into SHA-256 HMAC pseudonyms and DICOM headers are filtered before tasks enter the queue."
    )
    @ApiResponse(responseCode = "202", description = "Batch upload accepted and queued for processing",
            content = @Content(schema = @Schema(implementation = BatchJobResponseDto.class)))
    @ApiResponse(responseCode = "400", description = "Invalid payload or empty image list")
    public ResponseEntity<?> createBulkBatchJob(@Valid @RequestBody BulkUploadRequestDto request) {
        if (request.imageItems() == null || request.imageItems().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Danh sách ảnh tải lên không được để trống (Yêu cầu ít nhất 1 ảnh DICOM/PNG)."));
        }

        String batchId = "BATCH-" + System.currentTimeMillis();
        log.info("Creating Bulk Batch Job {} for Clinic {} with {} images.", batchId, request.clinicId(), request.imageItems().size());

        jobQueue.createBatchJob(batchId, request.clinicId(), request.imageItems().size());

        for (int i = 0; i < request.imageItems().size(); i++) {
            BulkImageItemUploadDto item = request.imageItems().get(i);
            String itemId = String.format("ITEM-%s-%03d", batchId, i + 1);

            // 1. HIPAA NFR-9/NFR-10 Anonymization
            PatientAnonymizedDto anonymizedPatient = anonymizerService.anonymizePatient(
                    item.rawMrn(),
                    item.rawPatientName(),
                    item.patientAge(),
                    item.patientGender(),
                    item.systolicBp(),
                    item.diastolicBp(),
                    item.hbA1c()
            );

            // 2. Strip DICOM headers
            String strippedBase64 = anonymizerService.stripDicomMetadataHeaders(item.base64ImageContent());

            // 3. Register item status
            BatchJobItemStatusDto initialItemStatus = new BatchJobItemStatusDto(
                    itemId,
                    item.fileName(),
                    item.eyePosition(),
                    anonymizedPatient.pseudonymId(),
                    "QUEUED",
                    0,
                    null
            );
            jobQueue.registerItem(batchId, initialItemStatus);

            // 4. Enqueue to Java LinkedBlockingQueue
            BatchItemTask task = new BatchItemTask(
                    batchId,
                    itemId,
                    item.fileName(),
                    item.eyePosition(),
                    anonymizedPatient,
                    strippedBase64
            );

            try {
                jobQueue.enqueue(task);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Lỗi đưa ảnh vào hàng đợi bất đồng bộ."));
            }
        }

        BatchJobResponseDto initialStatus = jobQueue.getBatchStatus(batchId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(initialStatus);
    }

    /**
     * Gets real-time execution status and progress metrics for a bulk batch job.
     */
    @GetMapping("/batch/{batchId}")
    @Operation(summary = "Get Real-Time Batch Progress & Status", description = "Polls execution progress, total processed, failed count, and estimated time remaining in seconds.")
    @ApiResponse(responseCode = "200", description = "Batch status fetched successfully")
    @ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ResponseEntity<?> getBatchStatus(@PathVariable String batchId) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy đợt sàng lọc hàng loạt với Mã ID: " + batchId));
        }

        return ResponseEntity.ok(status);
    }

    /**
     * Gets detailed AI analysis result for an individual image item inside a batch.
     */
    @GetMapping("/batch/{batchId}/items/{itemId}")
    @Operation(summary = "Get Detailed AI Analysis Result for a Specific Image")
    public ResponseEntity<?> getBatchItemResult(@PathVariable String batchId, @PathVariable String itemId) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đợt sàng lọc."));
        }

        return status.items().stream()
                .filter(i -> i.itemId().equals(itemId))
                .findFirst()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy bản ghi ảnh với ID: " + itemId)));
    }

    /**
     * Cancels or pauses execution of an active bulk batch job.
     */
    @PostMapping("/batch/{batchId}/cancel")
    @Operation(summary = "Cancel or Pause Active Bulk Batch Job")
    public ResponseEntity<?> cancelBatchJob(@PathVariable String batchId) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đợt sàng lọc."));
        }

        jobQueue.cancelBatch(batchId);
        return ResponseEntity.ok(Map.of("message", "Đã tạm dừng đợt sàng lọc hàng loạt thành công.", "batchId", batchId));
    }
}
