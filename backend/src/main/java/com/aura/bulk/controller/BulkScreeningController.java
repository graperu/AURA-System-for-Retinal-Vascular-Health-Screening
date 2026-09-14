package com.aura.bulk.controller;

import com.aura.auth.security.AuraUserPrincipal;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * RESTful Web API Controller for Bulk Retinal Fundus Screening (>=100 images batch processing).
 * Includes aggregated risk statistics (FR-25) and emergency high-risk alerts (FR-29).
 */
@RestController
@RequestMapping("/api/v1/bulk-screening")
@Tag(name = "Bulk Screening API", description = "Endpoints for bulk fundus image batch screening, statistics, and alerts")
public class BulkScreeningController {

    private static final Logger log = LoggerFactory.getLogger(BulkScreeningController.class);

    private final PatientAnonymizerService anonymizerService;
    private final BatchJobQueue jobQueue;
    private final com.aura.bulk.repository.BulkScreeningBatchRepository batchRepository;
    private final com.aura.bulk.repository.BulkScreeningItemRepository itemRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue,
            com.aura.bulk.repository.BulkScreeningBatchRepository batchRepository,
            com.aura.bulk.repository.BulkScreeningItemRepository itemRepository) {
        this.anonymizerService = anonymizerService;
        this.jobQueue = jobQueue;
        this.batchRepository = batchRepository;
        this.itemRepository = itemRepository;
    }

    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue) {
        this(anonymizerService, jobQueue, null, null);
    }

    private boolean hasRole(AuraUserPrincipal principal, String role) {
        if (principal == null || principal.roles() == null) {
            return false;
        }
        String target = role.toUpperCase();
        String targetWithPrefix = target.startsWith("ROLE_") ? target : "ROLE_" + target;
        String targetWithoutPrefix = target.startsWith("ROLE_") ? target.substring(5) : target;
        return principal.roles().stream()
                .map(String::toUpperCase)
                .anyMatch(r -> r.equals(targetWithPrefix) || r.equals(targetWithoutPrefix));
    }

    private boolean isAuthorizedForClinic(String clinicId, AuraUserPrincipal principal) {
        if (principal == null) {
            return true;
        }
        if (hasRole(principal, "ADMIN")) {
            return true;
        }
        return clinicId != null && principal.id().toString().equalsIgnoreCase(clinicId);
    }

    private boolean isAuthorizedForBatch(BatchJobResponseDto batch, AuraUserPrincipal principal) {
        if (batch == null) {
            return false;
        }
        return isAuthorizedForClinic(batch.clinicId(), principal);
    }

    /**
     * Uploads and enqueues a bulk batch of fundus images (>=100 images) for AI vascular screening.
     */
    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(
            summary = "Bulk Upload & Queue Fundus Images (>=100 Images)",
            description = "HIPAA NFR-9/NFR-10 Compliance: Patient PHI is automatically anonymized into SHA-256 HMAC pseudonyms and DICOM headers are filtered before tasks enter the queue."
    )
    @ApiResponse(responseCode = "202", description = "Batch upload accepted and queued for processing",
            content = @Content(schema = @Schema(implementation = BatchJobResponseDto.class)))
    @ApiResponse(responseCode = "400", description = "Invalid payload or empty image list")
    public ResponseEntity<?> createBulkBatchJob(
            @Valid @RequestBody BulkUploadRequestDto request,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        if (request.imageItems() == null || request.imageItems().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Danh sách ảnh tải lên không được để trống (Yêu cầu ít nhất 1 ảnh DICOM/PNG)."));
        }

        String effectiveClinicId;
        if (principal != null) {
            boolean isAdmin = hasRole(principal, "ADMIN");
            if (isAdmin && request.clinicId() != null && !request.clinicId().isBlank()) {
                effectiveClinicId = request.clinicId();
            } else {
                effectiveClinicId = principal.id().toString();
            }
        } else {
            effectiveClinicId = (request.clinicId() != null && !request.clinicId().isBlank()) ? request.clinicId() : "33333333-3333-3333-3333-333333333333";
        }

        String batchId = "BATCH-" + System.currentTimeMillis();
        log.info("Creating Bulk Batch Job {} for Clinic {} with {} images.", batchId, effectiveClinicId, request.imageItems().size());

        jobQueue.createBatchJob(batchId, effectiveClinicId, request.imageItems().size());

        java.util.UUID clinicUuid;
        try {
            clinicUuid = java.util.UUID.fromString(effectiveClinicId);
        } catch (Exception e) {
            clinicUuid = java.util.UUID.fromString("33333333-3333-3333-3333-333333333333");
        }

        com.aura.bulk.entity.BulkScreeningBatch batchEntity = null;
        if (batchRepository != null) {
            try {
                batchEntity = batchRepository.save(new com.aura.bulk.entity.BulkScreeningBatch(batchId, clinicUuid, request.imageItems().size()));
            } catch (Exception e) {
                log.warn("Không thể lưu BulkScreeningBatch vào PostgreSQL: {}", e.getMessage());
            }
        }

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

            // 3. Register item status in memory
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

            // 4. Lưu item vào PostgreSQL
            if (batchEntity != null && batchEntity.getId() != null && itemRepository != null) {
                try {
                    com.aura.bulk.entity.BulkScreeningItem itemEntity = new com.aura.bulk.entity.BulkScreeningItem(
                            batchEntity.getId(),
                            itemId,
                            item.fileName(),
                            item.eyePosition(),
                            anonymizedPatient.pseudonymId()
                    );
                    itemEntity.setPatientName(item.rawPatientName());
                    itemEntity.setRawMrn(item.rawMrn());
                    itemEntity.setPatientAge(item.patientAge());
                    itemEntity.setPatientGender(item.patientGender());
                    itemEntity.setSystolicBp(item.systolicBp());
                    itemEntity.setDiastolicBp(item.diastolicBp());
                    itemEntity.setHba1c(item.hbA1c());
                    itemRepository.save(itemEntity);
                } catch (Exception e) {
                    log.warn("Không thể lưu BulkScreeningItem vào PostgreSQL: {}", e.getMessage());
                }
            }

            // 5. Enqueue to Java LinkedBlockingQueue
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

    public ResponseEntity<?> createBulkBatchJob(BulkUploadRequestDto request) {
        return createBulkBatchJob(request, null);
    }

    /**
     * Lists all recent batch jobs for clinic oversight.
     */
    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "List all screening batches", description = "Retrieves all current and recent bulk screening batches.")
    public ResponseEntity<List<BatchJobResponseDto>> listBatches(@AuthenticationPrincipal AuraUserPrincipal principal) {
        List<BatchJobResponseDto> all = jobQueue.getAllBatches();
        if (principal == null || hasRole(principal, "ADMIN")) {
            return ResponseEntity.ok(all);
        }
        String currentClinicId = principal.id().toString();
        List<BatchJobResponseDto> filtered = all.stream()
                .filter(b -> currentClinicId.equalsIgnoreCase(b.clinicId()))
                .toList();
        return ResponseEntity.ok(filtered);
    }

    public ResponseEntity<List<BatchJobResponseDto>> listBatches() {
        return listBatches(null);
    }

    /**
     * Gets real-time execution status and progress metrics for a bulk batch job.
     */
    @GetMapping("/batch/{batchId}")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "Get Real-Time Batch Progress & Status", description = "Polls execution progress, total processed, failed count, and estimated time remaining in seconds.")
    @ApiResponse(responseCode = "200", description = "Batch status fetched successfully")
    @ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ResponseEntity<?> getBatchStatus(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy đợt sàng lọc hàng loạt với Mã ID: " + batchId));
        }
        if (!isAuthorizedForBatch(status, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác."));
        }

        return ResponseEntity.ok(status);
    }

    public ResponseEntity<?> getBatchStatus(String batchId) {
        return getBatchStatus(batchId, null);
    }

    /**
     * [FR-25] Gets aggregated risk statistics and distribution across all patients in a batch.
     */
    @GetMapping("/batch/{batchId}/statistics")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(
            summary = "Get Aggregated Risk Statistics (FR-25)",
            description = "TC-CLI-04: Returns aggregated risk metrics including distribution across Low, Moderate, High, and Critical risk, average vascular risk score, and stroke risk."
    )
    @ApiResponse(responseCode = "200", description = "Risk statistics calculated successfully")
    @ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ResponseEntity<?> getBatchRiskStatistics(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BulkBatchRiskStatisticsDto stats = jobQueue.calculateRiskStatistics(batchId);
        if (stats == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy đợt sàng lọc với Mã ID: " + batchId));
        }
        if (!isAuthorizedForClinic(stats.clinicId(), principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác."));
        }
        return ResponseEntity.ok(stats);
    }

    public ResponseEntity<?> getBatchRiskStatistics(String batchId) {
        return getBatchRiskStatistics(batchId, null);
    }

    /**
     * [FR-29] Gets emergency alerts for high-risk patients and abnormal trend notifications.
     */
    @GetMapping("/batch/{batchId}/alerts")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(
            summary = "Get High-Risk Alerts & Abnormal Trends (FR-29)",
            description = "TC-CLI-08: Returns emergency alerts for patients with severe vascular abnormalities and epidemic/cluster trend warnings."
    )
    @ApiResponse(responseCode = "200", description = "Alerts generated successfully")
    @ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ResponseEntity<?> getBatchAlerts(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BulkBatchAlertSummaryDto alerts = jobQueue.detectAlertsAndTrends(batchId);
        if (alerts == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy đợt sàng lọc với Mã ID: " + batchId));
        }
        if (!isAuthorizedForClinic(alerts.clinicId(), principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác."));
        }
        return ResponseEntity.ok(alerts);
    }

    public ResponseEntity<?> getBatchAlerts(String batchId) {
        return getBatchAlerts(batchId, null);
    }

    /**
     * Gets detailed AI analysis result for an individual image item inside a batch.
     */
    @GetMapping("/batch/{batchId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "Get Detailed AI Analysis Result for a Specific Image")
    public ResponseEntity<?> getBatchItemResult(@PathVariable String batchId, @PathVariable String itemId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đợt sàng lọc."));
        }
        if (!isAuthorizedForBatch(status, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác."));
        }

        return status.items().stream()
                .filter(i -> i.itemId().equals(itemId))
                .findFirst()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy bản ghi ảnh với ID: " + itemId)));
    }

    public ResponseEntity<?> getBatchItemResult(String batchId, String itemId) {
        return getBatchItemResult(batchId, itemId, null);
    }

    /**
     * Cancels or pauses execution of an active bulk batch job.
     */
    @PostMapping("/batch/{batchId}/cancel")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "Cancel or Pause Active Bulk Batch Job")
    public ResponseEntity<?> cancelBatchJob(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đợt sàng lọc."));
        }
        if (!isAuthorizedForBatch(status, principal)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền thao tác trên đợt sàng lọc của cơ sở y tế khác."));
        }

        jobQueue.cancelBatch(batchId);
        return ResponseEntity.ok(Map.of("message", "Đã tạm dừng đợt sàng lọc hàng loạt thành công.", "batchId", batchId));
    }

    public ResponseEntity<?> cancelBatchJob(String batchId) {
        return cancelBatchJob(batchId, null);
    }
}
