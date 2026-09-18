package com.aura.bulk.controller;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.bulk.dto.*;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.service.PatientAnonymizerService;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
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
    private final com.aura.billing.service.BillingService billingService;

    @org.springframework.beans.factory.annotation.Autowired
    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue,
            com.aura.bulk.repository.BulkScreeningBatchRepository batchRepository,
            com.aura.bulk.repository.BulkScreeningItemRepository itemRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.aura.billing.service.BillingService billingService) {
        this.anonymizerService = anonymizerService;
        this.jobQueue = jobQueue;
        this.batchRepository = batchRepository;
        this.itemRepository = itemRepository;
        this.billingService = billingService;
    }

    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue,
            com.aura.bulk.repository.BulkScreeningBatchRepository batchRepository,
            com.aura.bulk.repository.BulkScreeningItemRepository itemRepository) {
        this(anonymizerService, jobQueue, batchRepository, itemRepository, null);
    }

    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue) {
        this(anonymizerService, jobQueue, null, null, null);
    }

    public BulkScreeningController(
            PatientAnonymizerService anonymizerService,
            BatchJobQueue jobQueue,
            com.aura.billing.service.BillingService billingService) {
        this(anonymizerService, jobQueue, null, null, billingService);
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
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(
            summary = "Bulk Upload & Queue Fundus Images (>=100 Images)",
            description = "HIPAA NFR-9/NFR-10 Compliance: Patient PHI is automatically anonymized into SHA-256 HMAC pseudonyms and DICOM headers are filtered before tasks enter the queue."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "202", description = "Batch upload accepted and queued for processing",
            content = @Content(schema = @Schema(implementation = BatchJobResponseDto.class)))
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid payload or empty image list")
    public ApiResponse<BatchJobResponseDto> createBulkBatchJob(
            @Valid @RequestBody BulkUploadRequestDto request,
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        if (request.imageItems() == null || request.imageItems().isEmpty()) {
            throw new IllegalArgumentException("Danh sách ảnh tải lên không được để trống (Yêu cầu ít nhất 1 ảnh DICOM/PNG).");
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

        java.util.UUID clinicUuid;
        try {
            clinicUuid = java.util.UUID.fromString(effectiveClinicId);
        } catch (Exception e) {
            clinicUuid = java.util.UUID.fromString("33333333-3333-3333-3333-333333333333");
        }

        int requiredCredits = request.imageItems().size();
        int availableCredits = billingService != null ? billingService.getRemainingCredits(clinicUuid) : Integer.MAX_VALUE;
        if (requiredCredits > availableCredits) {
            throw new IllegalArgumentException(String.format("Cơ sở y tế không đủ lượt quét khả dụng (Cần %d, hiện có %d). Vui lòng nạp thêm gói lượt khám.", requiredCredits, availableCredits));
        }

        if (billingService != null) {
            boolean deducted = billingService.deductCredits(clinicUuid, requiredCredits);
            if (!deducted) {
                throw new IllegalArgumentException(String.format("Cơ sở y tế không đủ lượt quét khả dụng (Cần %d, hiện có %d). Vui lòng nạp thêm gói lượt khám.", requiredCredits, availableCredits));
            }
        }

        String batchId = "BATCH-" + System.currentTimeMillis();
        log.info("Creating Bulk Batch Job {} for Clinic {} with {} images.", batchId, effectiveClinicId, request.imageItems().size());

        jobQueue.createBatchJob(batchId, effectiveClinicId, request.imageItems().size());

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
                throw new RuntimeException("Lỗi đưa ảnh vào hàng đợi bất đồng bộ.", e);
            }
        }

        BatchJobResponseDto initialStatus = jobQueue.getBatchStatus(batchId);
        return ApiResponse.success("Đợt sàng lọc hàng loạt đã được tiếp nhận", initialStatus);
    }

    public ApiResponse<BatchJobResponseDto> createBulkBatchJob(BulkUploadRequestDto request) {
        return createBulkBatchJob(request, null);
    }

    /**
     * Lists all recent batch jobs for clinic oversight.
     */
    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "List all screening batches", description = "Retrieves all current and recent bulk screening batches.")
    public ApiResponse<List<BatchJobResponseDto>> listBatches(@AuthenticationPrincipal AuraUserPrincipal principal) {
        List<BatchJobResponseDto> all = jobQueue.getAllBatches();
        if (principal == null || hasRole(principal, "ADMIN")) {
            return ApiResponse.success("Lấy danh sách các đợt sàng lọc thành công", all);
        }
        String currentClinicId = principal.id().toString();
        List<BatchJobResponseDto> filtered = all.stream()
                .filter(b -> currentClinicId.equalsIgnoreCase(b.clinicId()))
                .toList();
        return ApiResponse.success("Lấy danh sách các đợt sàng lọc thành công", filtered);
    }

    public ApiResponse<List<BatchJobResponseDto>> listBatches() {
        return listBatches(null);
    }

    /**
     * Gets real-time execution status and progress metrics for a bulk batch job.
     */
    @GetMapping("/batch/{batchId}")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "Get Real-Time Batch Progress & Status", description = "Polls execution progress, total processed, failed count, and estimated time remaining in seconds.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Batch status fetched successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ApiResponse<BatchJobResponseDto> getBatchStatus(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            throw new ResourceNotFoundException("Không tìm thấy đợt sàng lọc hàng loạt với Mã ID: " + batchId);
        }
        if (!isAuthorizedForBatch(status, principal)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác.");
        }

        return ApiResponse.success("Lấy trạng thái đợt sàng lọc thành công", status);
    }

    public ApiResponse<BatchJobResponseDto> getBatchStatus(String batchId) {
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
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Risk statistics calculated successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ApiResponse<BulkBatchRiskStatisticsDto> getBatchRiskStatistics(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BulkBatchRiskStatisticsDto stats = jobQueue.calculateRiskStatistics(batchId);
        if (stats == null) {
            throw new ResourceNotFoundException("Không tìm thấy đợt sàng lọc với Mã ID: " + batchId);
        }
        if (!isAuthorizedForClinic(stats.clinicId(), principal)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác.");
        }
        return ApiResponse.success("Lấy thống kê rủi ro tổng hợp thành công", stats);
    }

    public ApiResponse<BulkBatchRiskStatisticsDto> getBatchRiskStatistics(String batchId) {
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
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Alerts generated successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Batch job ID not found")
    public ApiResponse<BulkBatchAlertSummaryDto> getBatchAlerts(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BulkBatchAlertSummaryDto alerts = jobQueue.detectAlertsAndTrends(batchId);
        if (alerts == null) {
            throw new ResourceNotFoundException("Không tìm thấy đợt sàng lọc với Mã ID: " + batchId);
        }
        if (!isAuthorizedForClinic(alerts.clinicId(), principal)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác.");
        }
        return ApiResponse.success("Lấy cảnh báo rủi ro cao thành công", alerts);
    }

    public ApiResponse<BulkBatchAlertSummaryDto> getBatchAlerts(String batchId) {
        return getBatchAlerts(batchId, null);
    }

    /**
     * Gets detailed AI analysis result for an individual image item inside a batch.
     */
    @GetMapping("/batch/{batchId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "Get Detailed AI Analysis Result for a Specific Image")
    public ApiResponse<BatchJobItemStatusDto> getBatchItemResult(@PathVariable String batchId, @PathVariable String itemId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            throw new ResourceNotFoundException("Không tìm thấy đợt sàng lọc.");
        }
        if (!isAuthorizedForBatch(status, principal)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập đợt sàng lọc của cơ sở y tế khác.");
        }

        BatchJobItemStatusDto item = status.items().stream()
                .filter(i -> i.itemId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bản ghi ảnh với ID: " + itemId));
        return ApiResponse.success("Lấy chi tiết kết quả ảnh thành công", item);
    }

    public ApiResponse<BatchJobItemStatusDto> getBatchItemResult(String batchId, String itemId) {
        return getBatchItemResult(batchId, itemId, null);
    }

    /**
     * Cancels or pauses execution of an active bulk batch job.
     */
    @PostMapping("/batch/{batchId}/cancel")
    @PreAuthorize("hasAnyRole('CLINIC', 'ADMIN')")
    @Operation(summary = "Cancel or Pause Active Bulk Batch Job")
    public ApiResponse<Map<String, Object>> cancelBatchJob(@PathVariable String batchId, @AuthenticationPrincipal AuraUserPrincipal principal) {
        BatchJobResponseDto status = jobQueue.getBatchStatus(batchId);
        if (status == null) {
            throw new ResourceNotFoundException("Không tìm thấy đợt sàng lọc.");
        }
        if (!isAuthorizedForBatch(status, principal)) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đợt sàng lọc của cơ sở y tế khác.");
        }

        jobQueue.cancelBatch(batchId);
        return ApiResponse.success("Đã tạm dừng đợt sàng lọc hàng loạt thành công.", Map.of("message", "Đã tạm dừng đợt sàng lọc hàng loạt thành công.", "batchId", batchId));
    }

    public ApiResponse<Map<String, Object>> cancelBatchJob(String batchId) {
        return cancelBatchJob(batchId, null);
    }
}
