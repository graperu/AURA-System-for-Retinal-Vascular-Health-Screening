package com.aura.bulk.worker;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
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
    private final RealtimeEventPublisher realtimeEventPublisher;
    private final com.aura.billing.service.BillingService billingService;
    private final ScreeningRepository screeningRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final PatientMedicalProfileRepository patientMedicalProfileRepository;
    private final UserRepository userRepository;
    private final com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository;
    private final com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository;
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    @Autowired
    public BulkProcessingWorker(
            BatchJobQueue jobQueue,
            AiServiceClient aiServiceClient,
            BulkScreeningItemRepository itemRepository,
            BulkScreeningBatchRepository batchRepository,
            @Autowired(required = false) RealtimeEventPublisher realtimeEventPublisher,
            @Autowired(required = false) com.aura.billing.service.BillingService billingService,
            @Autowired(required = false) ScreeningRepository screeningRepository,
            @Autowired(required = false) PatientProfileRepository patientProfileRepository,
            @Autowired(required = false) PatientMedicalProfileRepository patientMedicalProfileRepository,
            @Autowired(required = false) UserRepository userRepository,
            @Autowired(required = false) com.aura.doctor.repository.DoctorPatientAssignmentRepository assignmentRepository,
            @Autowired(required = false) com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository) {
        this.jobQueue = jobQueue;
        this.aiServiceClient = aiServiceClient;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
        this.realtimeEventPublisher = realtimeEventPublisher;
        this.billingService = billingService;
        this.screeningRepository = screeningRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.patientMedicalProfileRepository = patientMedicalProfileRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.clinicMemberRepository = clinicMemberRepository;
    }

    public BulkProcessingWorker(
            BatchJobQueue jobQueue,
            AiServiceClient aiServiceClient,
            BulkScreeningItemRepository itemRepository,
            BulkScreeningBatchRepository batchRepository,
            RealtimeEventPublisher realtimeEventPublisher,
            com.aura.billing.service.BillingService billingService) {
        this(jobQueue, aiServiceClient, itemRepository, batchRepository, realtimeEventPublisher, billingService, null, null, null, null, null, null);
    }

    public BulkProcessingWorker(
            BatchJobQueue jobQueue,
            AiServiceClient aiServiceClient,
            BulkScreeningItemRepository itemRepository,
            BulkScreeningBatchRepository batchRepository,
            RealtimeEventPublisher realtimeEventPublisher) {
        this(jobQueue, aiServiceClient, itemRepository, batchRepository, realtimeEventPublisher, null, null, null, null, null, null, null);
    }

    public BulkProcessingWorker(
            BatchJobQueue jobQueue,
            AiServiceClient aiServiceClient,
            BulkScreeningItemRepository itemRepository,
            BulkScreeningBatchRepository batchRepository) {
        this(jobQueue, aiServiceClient, itemRepository, batchRepository, null, null, null, null, null, null, null, null);
    }

    public BulkProcessingWorker(
            BatchJobQueue jobQueue,
            AiServiceClient aiServiceClient,
            BulkScreeningItemRepository itemRepository,
            BulkScreeningBatchRepository batchRepository,
            com.aura.billing.service.BillingService billingService) {
        this(jobQueue, aiServiceClient, itemRepository, batchRepository, null, billingService, null, null, null, null, null, null);
    }

    public BulkProcessingWorker(BatchJobQueue jobQueue, AiServiceClient aiServiceClient) {
        this(jobQueue, aiServiceClient, null, null, null, null, null, null, null, null, null, null);
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

                // DAT-02 FIX: Tự động tạo và lưu trữ bản ghi Screening trong bảng screenings
                if (screeningRepository != null) {
                    createAndPersistScreeningRecord(task, batch, item, result);
                }
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

            if (realtimeEventPublisher != null && batch.getClinicId() != null) {
                Map<String, Object> progressPayload = Map.of(
                    "batchId", batch.getBatchCode(),
                    "total", total,
                    "processed", processed,
                    "failed", failed,
                    "status", batch.getStatus()
                );
                realtimeEventPublisher.publishBatchProgress(batch.getClinicId(), progressPayload);
            }
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

            java.util.UUID clinicId = batch.getClinicId();
            if (billingService != null && clinicId != null) {
                try {
                    billingService.refundCredit(clinicId, 1);
                    log.info("[Bulk Worker] Đã hoàn trả 1 lượt khám cho cơ sở y tế {} do ca {} gặp sự cố.", clinicId, task.itemId());
                } catch (Exception ex) {
                    log.error("[Bulk Worker] Lỗi hoàn trả credit cho cơ sở y tế {}: {}", clinicId, ex.getMessage());
                }
            }

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

            if (realtimeEventPublisher != null && batch.getClinicId() != null) {
                Map<String, Object> progressPayload = Map.of(
                    "batchId", batch.getBatchCode(),
                    "total", totalImagesOf(batch),
                    "processed", processed,
                    "failed", failed,
                    "status", batch.getStatus()
                );
                realtimeEventPublisher.publishBatchProgress(batch.getClinicId(), progressPayload);
            }
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

    /**
     * DAT-02 FIX: Tạo thực thể Screening hoàn chỉnh từ kết quả phân tích AI sàng lọc hàng loạt
     * và liên kết vào hồ sơ bệnh nhân, phân công bác sĩ, phục vụ hiển thị đa portal.
     */
    private void createAndPersistScreeningRecord(
            BatchItemTask task,
            BulkScreeningBatch batch,
            BulkScreeningItem item,
            AiInferenceResultDto result) {
        try {
            UUID patientId = resolveOrCreatePatientId(item, batch.getClinicId());
            UUID doctorId = resolveDoctorId(patientId, batch.getClinicId());

            String imageUrl = task.base64ImagePayload();
            if (imageUrl != null && !imageUrl.isBlank()) {
                if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("/")) {
                    imageUrl = "data:image/jpeg;base64," + imageUrl;
                }
            } else if (item.getFileName() != null) {
                imageUrl = item.getFileName();
            } else {
                imageUrl = "";
            }

            Screening screening = new Screening(patientId, imageUrl);
            screening.setBatchId(batch.getId());
            screening.setClinicId(batch.getClinicId());
            screening.setDoctorId(doctorId);
            screening.setStatus(ScreeningStatus.ANALYZED);
            screening.setEyePosition(task.eyePosition() != null ? task.eyePosition() : "OD");
            screening.setScanType("Fundus");
            screening.setFileName(task.fileName());

            int overallScore = result.overallVascularRiskScore();
            screening.setRiskScore(overallScore);
            String levelStr = determineRiskLevel(result);
            RiskLevel riskLevel = RiskLevel.fromString(levelStr);
            screening.setRiskLevel(riskLevel);
            screening.setAiRiskLevel(riskLevel);
            screening.setConfidence(0.85);

            screening.setCardiovascularRiskScore(result.cardiovascularRiskScore());
            screening.setCardiovascularRiskLevel(result.cardiovascularRiskLevel());
            screening.setDiabeticRetinopathyRiskScore(result.diabeticRetinopathyScore());
            screening.setDiabeticRetinopathyRiskLevel(result.diabeticRetinopathyLevel());
            screening.setHypertensionRiskScore(result.cardiovascularRiskScore());
            screening.setHypertensionRiskLevel(result.cardiovascularRiskLevel());

            int strokeScore = (int) Math.round(result.threeYearStrokeRiskPercent() * 2);
            screening.setStrokeRiskScore(strokeScore);
            screening.setStrokeRiskLevel(result.threeYearStrokeRiskPercent() >= 25.0 ? "CRITICAL" :
                    result.threeYearStrokeRiskPercent() >= 18.0 ? "HIGH" :
                    result.threeYearStrokeRiskPercent() >= 10.0 ? "MODERATE" : "LOW");

            screening.setAvRatio(result.arteryVeinRatio());
            screening.setVesselDensityPercent(result.vesselDensityPercentage());
            screening.setTortuosityIndex(result.tortuosityIndex());
            screening.setVerticalCdr(result.opticCupToDiscRatio());
            screening.setHeatmapBase64(result.heatmapOverlayUrl());

            String findings = result.xaiRationales() != null && !result.xaiRationales().isEmpty()
                    ? String.join("; ", result.xaiRationales())
                    : item.getFindings();
            screening.setFindings(findings);
            screening.setAiModelVersion("Gemini 3.8 Flash High / AURA-Core v2.4");
            screening.setRecommendations("CRITICAL".equals(levelStr) || "HIGH".equals(levelStr)
                    ? "Cần hội chẩn chuyên khoa mắt và kiểm soát huyết áp chặt chẽ."
                    : "Tái khám định kỳ theo khuyến cáo lâm sàng.");
            screening.setDetectedAnomalies(result.detectedAnomaliesJson() != null && !result.detectedAnomaliesJson().isBlank()
                    ? result.detectedAnomaliesJson()
                    : "[]");

            Screening savedScreening = screeningRepository.save(screening);
            log.info("[Bulk Worker Java] DAT-02: Created Screening record {} for Bulk Item {} (Patient: {})",
                    savedScreening.getId(), item.getItemCode(), patientId);

            // R7: 1. Ensure Doctor-Patient Assignment exists in database
            if (assignmentRepository != null && doctorId != null && patientId != null && !patientId.equals(batch.getClinicId())) {
                try {
                    var existingAssignments = assignmentRepository.findByPatientIdAndStatus(patientId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
                    boolean assignedToThisDoctor = existingAssignments != null && existingAssignments.stream()
                        .anyMatch(a -> a.getDoctor() != null && doctorId.equals(a.getDoctor().getId()));
                    if (!assignedToThisDoctor) {
                        Optional<User> docOpt = userRepository != null ? userRepository.findById(doctorId) : Optional.empty();
                        Optional<User> patOpt = userRepository != null ? userRepository.findById(patientId) : Optional.empty();
                        if (docOpt.isPresent() && patOpt.isPresent()) {
                            com.aura.doctor.entity.DoctorPatientAssignment newAssignment =
                                new com.aura.doctor.entity.DoctorPatientAssignment(
                                    docOpt.get(), patOpt.get(), com.aura.doctor.entity.AssignmentStatus.ACTIVE, batch.getClinicId()
                                );
                            assignmentRepository.save(newAssignment);
                            log.info("[Bulk Worker] R7: Assigned patient {} to Doctor {} for clinic batch {}",
                                patientId, doctorId, batch.getBatchCode());
                        }
                    }
                } catch (Exception ex) {
                    log.warn("[Bulk Worker] R7: DoctorPatientAssignment upsert warning: {}", ex.getMessage());
                }
            }

            // R7: 2. Ensure PatientProfile exists and is linked to Doctor Worklist
            if (patientProfileRepository != null && item.getRawMrn() != null) {
                try {
                    Optional<User> docOpt = (doctorId != null && userRepository != null) ? userRepository.findById(doctorId) : Optional.empty();
                    String doctorFullName = docOpt.map(User::getFullName).orElse("BS. Chuyên khoa AURA");

                    var profOpt = patientProfileRepository.findByMrn(item.getRawMrn());
                    PatientProfile profile;
                    if (profOpt.isPresent()) {
                        profile = profOpt.get();
                    } else {
                        profile = new PatientProfile();
                        profile.setUserId(patientId);
                        profile.setMrn(item.getRawMrn());
                        profile.setFullName(item.getPatientName() != null ? item.getPatientName() : "Bệnh nhân " + item.getRawMrn());
                        profile.setAge(item.getPatientAge() != null ? item.getPatientAge() : 50);
                        profile.setGender(item.getPatientGender() != null ? item.getPatientGender() : "Khác");
                        profile.setSystolicBp(item.getSystolicBp() != null ? item.getSystolicBp() : 120);
                        profile.setDiastolicBp(item.getDiastolicBp() != null ? item.getDiastolicBp() : 80);
                        profile.setHba1c(item.getHba1c() != null ? item.getHba1c().doubleValue() : 5.7);
                    }
                    profile.setAssignedDoctor(doctorFullName);
                    profile.setLastExamDate(LocalDate.now().toString());
                    profile.setRiskScore(overallScore);
                    profile.setRiskLevel(levelStr);
                    profile.setReviewStatus("PENDING_REVIEW");
                    profile.setFindingsSummary(findings);
                    patientProfileRepository.save(profile);
                    log.info("[Bulk Worker] R7: Synced PatientProfile for MRN {} with Doctor {}", item.getRawMrn(), doctorFullName);
                } catch (Exception ex) {
                    log.warn("[Bulk Worker] R7: PatientProfile sync warning: {}", ex.getMessage());
                }
            }

            // R7: 3. STOMP Realtime event dispatch
            if (realtimeEventPublisher != null) {
                realtimeEventPublisher.publishScreeningCreated(savedScreening);
                realtimeEventPublisher.publishScreeningCompleted(savedScreening);
                if (doctorId != null) {
                    realtimeEventPublisher.publish("/topic/doctor." + doctorId, "SCREENING_CREATED", savedScreening);
                }
            }
        } catch (Exception ex) {
            log.error("[Bulk Worker Java] DAT-02: Error persisting Screening record for item {}: {}",
                    item.getItemCode(), ex.getMessage(), ex);
        }
    }

    private UUID resolveOrCreatePatientId(BulkScreeningItem item, UUID clinicId) {
        String rawMrn = item.getRawMrn();
        if (rawMrn != null && !rawMrn.isBlank()) {
            if (patientMedicalProfileRepository != null) {
                var medOpt = patientMedicalProfileRepository.findByMrn(rawMrn);
                if (medOpt.isPresent() && medOpt.get().getUser() != null) {
                    return medOpt.get().getUser().getId();
                }
            }
            if (patientProfileRepository != null) {
                var profOpt = patientProfileRepository.findByMrn(rawMrn);
                if (profOpt.isPresent() && profOpt.get().getUserId() != null) {
                    return profOpt.get().getUserId();
                }
            }
            if (userRepository != null) {
                String clean = rawMrn.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
                String email = "patient_" + clean + "@aura.local";
                var uOpt = userRepository.findByEmailIgnoreCase(email);
                if (uOpt.isPresent()) {
                    return uOpt.get().getId();
                }
                User newUser = new User(email, "$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/fU3015Bf/TcvB3cTeqr9f2oV2Dde",
                        item.getPatientName() != null ? item.getPatientName() : "Bệnh nhân " + rawMrn);
                newUser.setEmailVerified(true);
                newUser.setActive(true);
                User savedUser = userRepository.save(newUser);
                return savedUser.getId();
            }
        }
        return clinicId != null ? clinicId : UUID.randomUUID();
    }

    private UUID resolveDoctorId(UUID patientId, UUID clinicId) {
        if (assignmentRepository != null && patientId != null) {
            var assignments = assignmentRepository.findByPatientIdAndStatus(patientId, com.aura.doctor.entity.AssignmentStatus.ACTIVE);
            if (assignments != null && !assignments.isEmpty() && assignments.get(0).getDoctor() != null) {
                return assignments.get(0).getDoctor().getId();
            }
        }
        if (clinicMemberRepository != null && clinicId != null) {
            var members = clinicMemberRepository.findByClinicId(clinicId);
            if (members != null) {
                for (var m : members) {
                    if (m.getStatus() == com.aura.clinic.entity.ClinicMemberStatus.ACTIVE && m.getDoctor() != null) {
                        return m.getDoctor().getId();
                    }
                }
            }
        }
        return null;
    }
}
