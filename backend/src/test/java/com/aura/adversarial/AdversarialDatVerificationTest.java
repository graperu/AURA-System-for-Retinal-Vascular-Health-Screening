package com.aura.adversarial;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.service.AdminPatientAssignmentService;
import com.aura.audit.service.AuditLogService;
import com.aura.billing.service.BillingService;
import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.BatchJobResponseDto;
import com.aura.bulk.dto.BulkBatchAlertSummaryDto;
import com.aura.bulk.dto.BulkBatchRiskStatisticsDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import com.aura.bulk.service.PatientAnonymizerService;
import com.aura.bulk.worker.BulkProcessingWorker;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.dto.PatientProfileDto;
import com.aura.patient.dto.UpdatePatientProfileRequest;
import com.aura.patient.entity.PatientMedicalProfile;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.patient.service.PatientProfileService;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.role.enums.RoleName;
import com.aura.screening.dto.ScreeningResponse;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;

import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Empirical Adversarial Challenge Test Suite for Milestone 4.1.
 * Author: Challenger M4.1 (Adversarial Data Sync & Bulk Queue Challenger)
 * Scope: DAT-01, DAT-02, DAT-03, DAT-04, AUD-01.
 */
public class AdversarialDatVerificationTest {

  // =========================================================================
  // SUITE 1: ADVERSARIAL DAT-01 (Dual Patient Profile 2-Way Synchronization)
  // =========================================================================
  @Nested
  @DisplayName("Adversarial DAT-01: Dual Profile 2-Way Sync & Doctor Assignment Propagation")
  class Dat01DualProfileSyncTests {

    @Test
    @DisplayName("DAT-01.1: Concurrent multi-threaded updates between patient vitals and doctor worklist profile")
    void testConcurrentProfileAndMedicalUpdates() throws Exception {
      PatientMedicalProfileRepository profileRepo = mock(PatientMedicalProfileRepository.class);
      UserRepository userRepo = mock(UserRepository.class);
      PatientProfileRepository patientRepo = mock(PatientProfileRepository.class);
      DoctorPatientAssignmentRepository assignmentRepo = mock(DoctorPatientAssignmentRepository.class);

      PatientProfileService service = new PatientProfileService(profileRepo, userRepo, patientRepo, assignmentRepo);

      UUID patientUserId = UUID.randomUUID();
      UUID patientProfileId = UUID.randomUUID();
      String mrn = "MRN-CONCURRENT-01";

      User user = new User("patient.concurrent@aura.local", "hashed_pwd", "Nguyen Thi Concurrent");
      org.springframework.test.util.ReflectionTestUtils.setField(user, "id", patientUserId);

      PatientProfile patientProfile = new PatientProfile();
      org.springframework.test.util.ReflectionTestUtils.setField(patientProfile, "id", patientProfileId);
      patientProfile.setUserId(patientUserId);
      patientProfile.setMrn(mrn);
      patientProfile.setFullName("Nguyen Thi Concurrent");

      PatientMedicalProfile medicalProfile = new PatientMedicalProfile(user, mrn);

      when(userRepo.findById(patientUserId)).thenReturn(Optional.of(user));
      when(patientRepo.findById(patientProfileId)).thenReturn(Optional.of(patientProfile));
      when(patientRepo.findByUserId(patientUserId)).thenReturn(Optional.of(patientProfile));
      when(patientRepo.findByMrn(mrn)).thenReturn(Optional.of(patientProfile));
      when(profileRepo.findByUserIdWithUser(patientUserId)).thenReturn(Optional.of(medicalProfile));
      when(profileRepo.findByUserId(patientUserId)).thenReturn(Optional.of(medicalProfile));
      when(profileRepo.findByMrn(mrn)).thenReturn(Optional.of(medicalProfile));

      when(patientRepo.save(any(PatientProfile.class))).thenAnswer(inv -> inv.getArgument(0));
      when(profileRepo.save(any(PatientMedicalProfile.class))).thenAnswer(inv -> inv.getArgument(0));
      when(userRepo.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

      int threadCount = 20;
      ExecutorService executor = Executors.newFixedThreadPool(threadCount);
      CountDownLatch readyLatch = new CountDownLatch(threadCount);
      CountDownLatch startLatch = new CountDownLatch(1);
      CountDownLatch doneLatch = new CountDownLatch(threadCount);
      AtomicInteger errorCount = new AtomicInteger(0);

      for (int i = 0; i < threadCount; i++) {
        final int index = i;
        executor.submit(() -> {
          readyLatch.countDown();
          try {
            startLatch.await();
            if (index % 2 == 0) {
              UpdatePatientProfileRequest req = new UpdatePatientProfileRequest(
                  "Nguyen Thi Concurrent " + index,
                  LocalDate.of(1985, 5, 20),
                  39,
                  "Female",
                  "0901234567",
                  "Address " + index,
                  "O+",
                  130 + (index % 10),
                  85 + (index % 5),
                  6.5 + (index * 0.1),
                  true,
                  "Type2",
                  3,
                  true,
                  false,
                  false,
                  false,
                  "Metformin",
                  "None",
                  "Contact",
                  "0909999999"
              );
              service.updateProfile(patientUserId, req);
            } else {
              PatientProfile updateData = new PatientProfile();
              updateData.setFullName("Nguyen Thi Concurrent DoctorUpdated " + index);
              updateData.setAge(40);
              updateData.setGender("Female");
              updateData.setPhone("0901234567");
              updateData.setAddress("Clinic Room " + index);
              updateData.setSystolicBp(140);
              updateData.setDiastolicBp(90);
              updateData.setHba1c(7.2);
              updateData.setHasDiabetes(true);
              updateData.setHasHypertension(true);
              updateData.setHistoryOfSmoking(false);
              updateData.setAssignedDoctor("BS. Le Thi " + index);
              updateData.setRiskScore(75);
              updateData.setRiskLevel("HIGH");
              updateData.setReviewStatus("REVIEWED");
              updateData.setFindingsSummary("Moderate non-proliferative diabetic retinopathy");
              service.updatePatient(patientProfileId, updateData);
            }
          } catch (Exception ex) {
            errorCount.incrementAndGet();
          } finally {
            doneLatch.countDown();
          }
        });
      }

      readyLatch.await(5, TimeUnit.SECONDS);
      startLatch.countDown();
      boolean finished = doneLatch.await(10, TimeUnit.SECONDS);
      executor.shutdown();

      assertThat(finished).as("All 20 concurrent threads must complete within timeout").isTrue();
      assertThat(errorCount.get()).as("Zero exceptions during concurrent cross-table synchronization").isEqualTo(0);

      verify(patientRepo, atLeastOnce()).save(any(PatientProfile.class));
      verify(profileRepo, atLeastOnce()).save(any(PatientMedicalProfile.class));

      assertThat(medicalProfile.getSystolicBp()).isNotNull().isGreaterThan(120);
      assertThat(medicalProfile.getDiastolicBp()).isNotNull().isGreaterThan(70);
      assertThat(medicalProfile.getHasDiabetes()).isTrue();
    }

    @Test
    @DisplayName("DAT-01.2: Complete Doctor Unassignment lifecycle propagates to both tables as NULL")
    void testDoctorUnassignmentPropagatesNullToBothTables() {
      PatientMedicalProfileRepository profileRepo = mock(PatientMedicalProfileRepository.class);
      UserRepository userRepo = mock(UserRepository.class);
      PatientProfileRepository patientRepo = mock(PatientProfileRepository.class);
      DoctorPatientAssignmentRepository assignmentRepo = mock(DoctorPatientAssignmentRepository.class);
      UserRoleRepository userRoleRepo = mock(UserRoleRepository.class);

      AdminPatientAssignmentService adminService = new AdminPatientAssignmentService(
          assignmentRepo, profileRepo, userRepo, userRoleRepo, patientRepo
      );

      UUID doctorId = UUID.randomUUID();
      UUID patientId = UUID.randomUUID();

      User doctor = new User("dr.tran@aura.local", "hash", "BS. Tran Van B");
      org.springframework.test.util.ReflectionTestUtils.setField(doctor, "id", doctorId);
      doctor.setActive(true);

      User patient = new User("patient.unassign@aura.local", "hash", "B?nh Nh?n Unassign");
      org.springframework.test.util.ReflectionTestUtils.setField(patient, "id", patientId);
      patient.setActive(true);

      PatientMedicalProfile medProfile = new PatientMedicalProfile(patient, "MRN-UNASSIGN-01");
      medProfile.setAssignedDoctor("BS. Tran Van B");

      PatientProfile worklistProfile = new PatientProfile();
      worklistProfile.setUserId(patientId);
      worklistProfile.setMrn("MRN-UNASSIGN-01");
      worklistProfile.setAssignedDoctor("BS. Tran Van B");

      DoctorPatientAssignment assignment = new DoctorPatientAssignment(doctor, patient, AssignmentStatus.ACTIVE, UUID.randomUUID());

      when(assignmentRepo.findByDoctorIdAndPatientId(doctorId, patientId)).thenReturn(Optional.of(assignment));
      when(assignmentRepo.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE)).thenReturn(Collections.emptyList());
      when(profileRepo.findByUserId(patientId)).thenReturn(Optional.of(medProfile));
      when(patientRepo.findByUserId(patientId)).thenReturn(Optional.of(worklistProfile));

      when(userRoleRepo.findActiveUsersByRole(RoleName.DOCTOR)).thenReturn(List.of(doctor));
      when(userRoleRepo.findActiveUsersByRole(RoleName.USER)).thenReturn(List.of(patient));
      when(assignmentRepo.findByStatus(AssignmentStatus.ACTIVE)).thenReturn(Collections.emptyList());
      when(profileRepo.findAll()).thenReturn(List.of(medProfile));

      adminService.unassign(doctorId, patientId);

      assertThat(assignment.getStatus()).isEqualTo(AssignmentStatus.INACTIVE);
      assertThat(medProfile.getAssignedDoctor()).as("PatientMedicalProfile assignedDoctor must be null after all doctors unassigned").isNull();
      assertThat(worklistProfile.getAssignedDoctor()).as("PatientProfile assignedDoctor must be null after all doctors unassigned").isNull();

      verify(profileRepo).save(medProfile);
      verify(patientRepo).save(worklistProfile);
    }

    @Test
    @DisplayName("DAT-01.3: UpdatePatient resolves detached PatientProfile by MRN and syncs vitals to PatientMedicalProfile")
    void testUpdatePatientResolvesByMrnWhenUserIdDetached() {
      PatientMedicalProfileRepository profileRepo = mock(PatientMedicalProfileRepository.class);
      UserRepository userRepo = mock(UserRepository.class);
      PatientProfileRepository patientRepo = mock(PatientProfileRepository.class);
      DoctorPatientAssignmentRepository assignmentRepo = mock(DoctorPatientAssignmentRepository.class);

      PatientProfileService service = new PatientProfileService(profileRepo, userRepo, patientRepo, assignmentRepo);

      UUID profileId = UUID.randomUUID();
      String mrn = "MRN-DETACHED-777";

      PatientProfile detachedProfile = new PatientProfile();
      org.springframework.test.util.ReflectionTestUtils.setField(detachedProfile, "id", profileId);
      detachedProfile.setUserId(null);
      detachedProfile.setMrn(mrn);
      detachedProfile.setFullName("Detached Patient");

      User patientUser = new User("detached@aura.local", "hash", "Detached Patient");
      UUID patientUserId = UUID.randomUUID();
      org.springframework.test.util.ReflectionTestUtils.setField(patientUser, "id", patientUserId);

      PatientMedicalProfile medProfile = new PatientMedicalProfile(patientUser, mrn);
      medProfile.setSystolicBp(120);
      medProfile.setDiastolicBp(80);

      when(patientRepo.findById(profileId)).thenReturn(Optional.of(detachedProfile));
      when(patientRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
      when(profileRepo.findByMrn(mrn)).thenReturn(Optional.of(medProfile));
      when(profileRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

      PatientProfile updatePayload = new PatientProfile();
      updatePayload.setFullName("Detached Patient Re-Exam");
      updatePayload.setSystolicBp(165);
      updatePayload.setDiastolicBp(105);
      updatePayload.setHba1c(9.8);
      updatePayload.setHasDiabetes(true);
      updatePayload.setHasHypertension(true);
      updatePayload.setHistoryOfSmoking(true);
      updatePayload.setAssignedDoctor("BS. Nguyen Special");

      PatientProfileDto result = service.updatePatient(profileId, updatePayload);

      assertThat(result).isNotNull();
      assertThat(result.systolicBp()).isEqualTo(165);
      assertThat(result.diastolicBp()).isEqualTo(105);

      assertThat(medProfile.getSystolicBp()).isEqualTo(165);
      assertThat(medProfile.getDiastolicBp()).isEqualTo(105);
      assertThat(medProfile.getHba1c()).isEqualTo(9.8);
      assertThat(medProfile.getHasDiabetes()).isTrue();
      assertThat(medProfile.getAssignedDoctor()).isEqualTo("BS. Nguyen Special");
      verify(profileRepo).save(medProfile);
    }
  }

  // =========================================================================
  // SUITE 2: ADVERSARIAL DAT-02 (Bulk Screening Genuine Screening Records)
  // =========================================================================
  @Nested
  @DisplayName("Adversarial DAT-02: Bulk Item Genuine Screening Entity Creation & Biomarkers Persistence")
  class Dat02BulkItemScreeningCreationTests {

    @Test
    @DisplayName("DAT-02.1: syncItemAndBatchSuccess generates genuine Screening entity with full clinical biomarkers and STOMP events")
    void testBulkItemProducesFullScreeningEntity() throws Exception {
      BatchJobQueue jobQueue = mock(BatchJobQueue.class);
      AiServiceClient aiServiceClient = mock(AiServiceClient.class);
      BulkScreeningItemRepository itemRepo = mock(BulkScreeningItemRepository.class);
      BulkScreeningBatchRepository batchRepo = mock(BulkScreeningBatchRepository.class);
      ScreeningRepository screeningRepo = mock(ScreeningRepository.class);
      BillingService billingService = mock(BillingService.class);
      PatientProfileRepository patientProfileRepo = mock(PatientProfileRepository.class);
      PatientMedicalProfileRepository patientMedRepo = mock(PatientMedicalProfileRepository.class);
      UserRepository userRepo = mock(UserRepository.class);
      DoctorPatientAssignmentRepository assignmentRepo = mock(DoctorPatientAssignmentRepository.class);
      ClinicMemberRepository clinicMemberRepo = mock(ClinicMemberRepository.class);
      RealtimeEventPublisher realtimePublisher = mock(RealtimeEventPublisher.class);

      BulkProcessingWorker worker = new BulkProcessingWorker(
          jobQueue, aiServiceClient, itemRepo, batchRepo, realtimePublisher, billingService,
          screeningRepo, patientProfileRepo, patientMedRepo, userRepo, assignmentRepo, clinicMemberRepo
      );

      UUID clinicId = UUID.randomUUID();
      UUID batchEntityId = UUID.randomUUID();
      String batchCode = "BATCH-DAT02-01";
      String itemCode = "ITEM-DAT02-001";
      String rawMrn = "MRN-BULK-101";

      BulkScreeningBatch batch = new BulkScreeningBatch();
      org.springframework.test.util.ReflectionTestUtils.setField(batch, "id", batchEntityId);
      batch.setBatchCode(batchCode);
      batch.setClinicId(clinicId);
      batch.setTotalImages(10);
      batch.setProcessedCount(0);
      batch.setFailedCount(0);
      batch.setStatus("IN_PROGRESS");

      BulkScreeningItem item = new BulkScreeningItem();
      item.setBatchId(batchEntityId);
      item.setItemCode(itemCode);
      item.setFileName("fundus_scan_right.jpg");
      item.setRawMrn(rawMrn);
      item.setPatientName("Tran Thi Bulk");
      item.setStatus("PROCESSING");

      PatientProfile existingProfile = new PatientProfile();
      existingProfile.setMrn(rawMrn);
      existingProfile.setFullName("Tran Thi Bulk");
      existingProfile.setReviewStatus("PENDING");

      User patientUser = new User("patient_mrnbulk101@aura.local", "hash", "Tran Thi Bulk");
      UUID patientUserId = UUID.randomUUID();
      org.springframework.test.util.ReflectionTestUtils.setField(patientUser, "id", patientUserId);
      existingProfile.setUserId(patientUserId);

      when(batchRepo.findByBatchCode(batchCode)).thenReturn(Optional.of(batch));
      when(itemRepo.findByBatchIdAndItemCode(batchEntityId, itemCode)).thenReturn(Optional.of(item));
      when(patientProfileRepo.findByMrn(rawMrn)).thenReturn(Optional.of(existingProfile));
      when(userRepo.findByEmailIgnoreCase(anyString())).thenReturn(Optional.of(patientUser));

      when(screeningRepo.save(any(Screening.class))).thenAnswer(inv -> {
        Screening s = inv.getArgument(0);
        org.springframework.test.util.ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
        return s;
      });

      PatientAnonymizedDto patientAnon = new PatientAnonymizedDto(
          "pseudo-101", rawMrn, 58, "Female", 145, 92, 7.8, true, false, Instant.now()
      );
      BatchItemTask task = new BatchItemTask(
          batchCode, itemCode, "fundus_scan_right.jpg", "OD", patientAnon, "data:image/jpeg;base64,iVBORw0KGgoAAA..."
      );

      AiInferenceResultDto aiResult = new AiInferenceResultDto(
          "ai-run-999",
          1850L,
          82,
          80,
          "Critical",
          75,
          "Severe",
          24.5,
          0.52,
          14.8,
          1.42,
          0.68,
          "data:image/png;base64,HEATMAP_OVERLAY_BYTES",
          3,
          List.of("Severe arteriolar narrowing (AVR: 0.52)", "Microaneurysms detected in macula", "High stroke hazard")
      );

      Method syncSuccessMethod = BulkProcessingWorker.class.getDeclaredMethod(
          "syncItemAndBatchSuccess", BatchItemTask.class, long.class, AiInferenceResultDto.class
      );
      syncSuccessMethod.setAccessible(true);
      syncSuccessMethod.invoke(worker, task, 1850L, aiResult);

      ArgumentCaptor<Screening> screeningCaptor = ArgumentCaptor.forClass(Screening.class);
      verify(screeningRepo).save(screeningCaptor.capture());
      Screening created = screeningCaptor.getValue();

      assertThat(created).isNotNull();
      assertThat(created.getPatientId()).isEqualTo(patientUserId);
      assertThat(created.getBatchId()).isEqualTo(batchEntityId);
      assertThat(created.getClinicId()).isEqualTo(clinicId);
      assertThat(created.getStatus()).isEqualTo(ScreeningStatus.ANALYZED);
      assertThat(created.getRiskScore()).isEqualTo(82);
      assertThat(created.getRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
      assertThat(created.getEyePosition()).isEqualTo("OD");

      assertThat(created.getAvRatio()).isEqualTo(0.52);
      assertThat(created.getVesselDensityPercent()).isEqualTo(14.8);
      assertThat(created.getTortuosityIndex()).isEqualTo(1.42);
      assertThat(created.getVerticalCdr()).isEqualTo(0.68);

      assertThat(created.getStrokeRiskScore()).isEqualTo(49);
      assertThat(created.getStrokeRiskLevel()).isEqualTo("HIGH");
      assertThat(created.getDiabeticRetinopathyRiskScore()).isEqualTo(75);
      assertThat(created.getDiabeticRetinopathyRiskLevel()).isEqualTo("Severe");

      assertThat(created.getAiModelVersion()).isIn("Gemini 3.7 Flash High / AURA-Core v2.4", "Gemini 3.8 Flash High / AURA-Core v2.4");
      assertThat(created.getHeatmapBase64()).isEqualTo("data:image/png;base64,HEATMAP_OVERLAY_BYTES");

      assertThat(existingProfile.getReviewStatus()).isEqualTo("PENDING_REVIEW");
      assertThat(existingProfile.getRiskScore()).isEqualTo(82);
      assertThat(existingProfile.getRiskLevel()).isEqualTo("CRITICAL");
      assertThat(existingProfile.getLastExamDate()).isEqualTo(LocalDate.now().toString());

      verify(realtimePublisher).publishScreeningCreated(any(Screening.class));
      verify(realtimePublisher).publishScreeningCompleted(any(Screening.class));
    }

    @Test
    @DisplayName("DAT-02.2: Unregistered MRN in bulk upload automatically provisions patient User account without crashing")
    void testUnregisteredMrnAutoProvisionsUser() throws Exception {
      BulkScreeningItemRepository itemRepo = mock(BulkScreeningItemRepository.class);
      BulkScreeningBatchRepository batchRepo = mock(BulkScreeningBatchRepository.class);
      ScreeningRepository screeningRepo = mock(ScreeningRepository.class);
      UserRepository userRepo = mock(UserRepository.class);

      BulkProcessingWorker worker = new BulkProcessingWorker(
          mock(BatchJobQueue.class), mock(AiServiceClient.class), itemRepo, batchRepo, null, null,
          screeningRepo, null, null, userRepo, null, null
      );

      BulkScreeningBatch batch = new BulkScreeningBatch();
      org.springframework.test.util.ReflectionTestUtils.setField(batch, "id", UUID.randomUUID());
      batch.setBatchCode("BATCH-NEWUSER-01");
      batch.setTotalImages(1);

      BulkScreeningItem item = new BulkScreeningItem();
      item.setBatchId(batch.getId());
      item.setItemCode("ITEM-NEW-01");
      item.setRawMrn("MRN-BRANDNEW-888");
      item.setPatientName("Tran Van Newbie");

      when(batchRepo.findByBatchCode("BATCH-NEWUSER-01")).thenReturn(Optional.of(batch));
      when(itemRepo.findByBatchIdAndItemCode(batch.getId(), "ITEM-NEW-01")).thenReturn(Optional.of(item));
      when(userRepo.findByEmailIgnoreCase("patient_mrnbrandnew888@aura.local")).thenReturn(Optional.empty());

      UUID newUserId = UUID.randomUUID();
      when(userRepo.save(any(User.class))).thenAnswer(inv -> {
        User u = inv.getArgument(0);
        org.springframework.test.util.ReflectionTestUtils.setField(u, "id", newUserId);
        return u;
      });

      when(screeningRepo.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

      PatientAnonymizedDto anon = new PatientAnonymizedDto("ps-new", "MRN-BRANDNEW-888", 45, "Male", 120, 80, 5.4, false, false, Instant.now());
      BatchItemTask task = new BatchItemTask("BATCH-NEWUSER-01", "ITEM-NEW-01", "scan.jpg", "OS", anon, "base64");
      AiInferenceResultDto result = new AiInferenceResultDto(
          "ai-new", 1000L, 45, 45, "Moderate", 40, "Mild", 10.0, 0.65, 18.0, 1.1, 0.35, null, 0, List.of()
      );

      Method syncSuccessMethod = BulkProcessingWorker.class.getDeclaredMethod(
          "syncItemAndBatchSuccess", BatchItemTask.class, long.class, AiInferenceResultDto.class
      );
      syncSuccessMethod.setAccessible(true);
      syncSuccessMethod.invoke(worker, task, 1000L, result);

      ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
      verify(userRepo).save(userCaptor.capture());
      User createdUser = userCaptor.getValue();
      assertThat(createdUser.getEmail()).isEqualTo("patient_mrnbrandnew888@aura.local");
      assertThat(createdUser.getFullName()).isEqualTo("Tran Van Newbie");
      assertThat(createdUser.isActive()).isTrue();

      ArgumentCaptor<Screening> screeningCaptor = ArgumentCaptor.forClass(Screening.class);
      verify(screeningRepo).save(screeningCaptor.capture());
      assertThat(screeningCaptor.getValue().getPatientId()).isEqualTo(newUserId);
    }
  }

  // =========================================================================
  // SUITE 3: ADVERSARIAL DAT-03 (PostgreSQL Persistent Batch Queue Recovery)
  // =========================================================================
  @Nested
  @DisplayName("Adversarial DAT-03: PostgreSQL Persistent Batch Queue & Crash Recovery")
  class Dat03PersistentBatchQueueTests {

    @Test
    @DisplayName("DAT-03.1: Simulated server restart: recoverStateOnStartup re-enqueues valid tasks and marks corrupted items as FAILED")
    void testServerRestartStateRecovery() throws Exception {
      BulkScreeningBatchRepository batchRepo = mock(BulkScreeningBatchRepository.class);
      BulkScreeningItemRepository itemRepo = mock(BulkScreeningItemRepository.class);
      PatientAnonymizerService anonymizer = mock(PatientAnonymizerService.class);
      BillingService billingService = mock(BillingService.class);

      UUID batchId = UUID.randomUUID();
      String batchCode = "BATCH-RESTART-01";

      BulkScreeningBatch dbBatch = new BulkScreeningBatch();
      org.springframework.test.util.ReflectionTestUtils.setField(dbBatch, "id", batchId);
      dbBatch.setBatchCode(batchCode);
      dbBatch.setClinicId(UUID.randomUUID());
      dbBatch.setTotalImages(3);
      dbBatch.setProcessedCount(1);
      dbBatch.setFailedCount(0);
      dbBatch.setStatus("IN_PROGRESS");
      org.springframework.test.util.ReflectionTestUtils.setField(dbBatch, "createdAt", Instant.now().minusSeconds(300));

      BulkScreeningItem item1 = new BulkScreeningItem();
      item1.setBatchId(batchId);
      item1.setItemCode("ITEM-001");
      item1.setStatus("COMPLETED");
      item1.setRiskScore(72);
      item1.setRiskLevel("HIGH");
      item1.setDurationMs(1500L);

      BulkScreeningItem item2 = new BulkScreeningItem();
      item2.setBatchId(batchId);
      item2.setItemCode("ITEM-002");
      item2.setFileName("interrupted_scan.png");
      item2.setEyePosition("OD");
      item2.setRawMrn("MRN-INT-02");
      item2.setStatus("PROCESSING");
      item2.setImagePayload("iVBORw0KGgoAAAANSUhEUgAA_BASE64_VALID_PAYLOAD");

      BulkScreeningItem item3 = new BulkScreeningItem();
      item3.setBatchId(batchId);
      item3.setItemCode("ITEM-003");
      item3.setStatus("QUEUED");
      item3.setImagePayload(null);

      when(batchRepo.findAll()).thenReturn(List.of(dbBatch));
      when(itemRepo.findByBatchIdOrderByCreatedAtAsc(batchId)).thenReturn(List.of(item1, item2, item3));

      BatchJobQueue freshQueue = new BatchJobQueue(batchRepo, itemRepo, anonymizer, billingService);

      freshQueue.recoverStateOnStartup();

      BatchJobResponseDto status = freshQueue.getBatchStatus(batchCode);
      assertThat(status).isNotNull();
      assertThat(status.batchId()).isEqualTo(batchCode);
      assertThat(status.totalImages()).isEqualTo(3);
      assertThat(status.items()).hasSize(3);

      BatchItemTask reEnqueuedTask = freshQueue.dequeue();
      assertThat(reEnqueuedTask).isNotNull();
      assertThat(reEnqueuedTask.batchId()).isEqualTo(batchCode);
      assertThat(reEnqueuedTask.itemId()).isEqualTo("ITEM-002");
      assertThat(reEnqueuedTask.base64ImagePayload()).isEqualTo("iVBORw0KGgoAAAANSUhEUgAA_BASE64_VALID_PAYLOAD");

      verify(itemRepo).save(item3);
      assertThat(item3.getStatus()).isEqualTo("FAILED");
      assertThat(item3.getErrorMessage()).isNotBlank();
    }

    @Test
    @DisplayName("DAT-03.2: Cache-Aside cold query transparently recovers batch and calculates statistics from PostgreSQL")
    void testCacheMissFallbackAndRiskStatistics() {
      BulkScreeningBatchRepository batchRepo = mock(BulkScreeningBatchRepository.class);
      BulkScreeningItemRepository itemRepo = mock(BulkScreeningItemRepository.class);

      UUID batchId = UUID.randomUUID();
      String batchCode = "BATCH-COLD-55";

      BulkScreeningBatch dbBatch = new BulkScreeningBatch();
      org.springframework.test.util.ReflectionTestUtils.setField(dbBatch, "id", batchId);
      dbBatch.setBatchCode(batchCode);
      dbBatch.setClinicId(UUID.randomUUID());
      dbBatch.setTotalImages(2);
      dbBatch.setProcessedCount(2);
      dbBatch.setStatus("COMPLETED");

      BulkScreeningItem it1 = new BulkScreeningItem();
      it1.setBatchId(batchId);
      it1.setItemCode("IT-1");
      it1.setStatus("COMPLETED");
      it1.setRiskScore(85);
      it1.setRiskLevel("CRITICAL");

      BulkScreeningItem it2 = new BulkScreeningItem();
      it2.setBatchId(batchId);
      it2.setItemCode("IT-2");
      it2.setStatus("COMPLETED");
      it2.setRiskScore(45);
      it2.setRiskLevel("MODERATE");

      when(batchRepo.findByBatchCode(batchCode)).thenReturn(Optional.of(dbBatch));
      when(itemRepo.findByBatchIdOrderByCreatedAtAsc(batchId)).thenReturn(List.of(it1, it2));

      BatchJobQueue queue = new BatchJobQueue(batchRepo, itemRepo, null, null);

      assertThat(queue.getLatestBatchId()).isNull();

      BulkBatchRiskStatisticsDto stats = queue.calculateRiskStatistics(batchCode);
      assertThat(stats).isNotNull();
      assertThat(stats.batchId()).isEqualTo(batchCode);
      assertThat(stats.totalImages()).isEqualTo(2);
      assertThat(stats.processedCount()).isEqualTo(2);
      assertThat(stats.averageVascularRiskScore()).isEqualTo(65.0);
      assertThat(stats.riskDistribution().criticalCount()).isEqualTo(1);
      assertThat(stats.riskDistribution().moderateCount()).isEqualTo(1);

      BulkBatchAlertSummaryDto alerts = queue.detectAlertsAndTrends(batchCode);
      assertThat(alerts).isNotNull();
      assertThat(alerts.criticalAlertsCount()).isEqualTo(1);
      assertThat(alerts.totalAlerts()).isEqualTo(1);
      assertThat(alerts.hasAbnormalTrend()).isFalse();

      BatchJobResponseDto cachedStatus = queue.getBatchStatus(batchCode);
      assertThat(cachedStatus).isNotNull();
      assertThat(cachedStatus.status()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("DAT-03.3: cancelBatch persists CANCELLED state to PostgreSQL ensuring persistence across restarts")
    void testCancelBatchPersistsToPostgres() {
      BulkScreeningBatchRepository batchRepo = mock(BulkScreeningBatchRepository.class);
      String batchCode = "BATCH-CANCEL-99";
      BulkScreeningBatch dbBatch = new BulkScreeningBatch();
      dbBatch.setBatchCode(batchCode);
      dbBatch.setStatus("IN_PROGRESS");

      when(batchRepo.findByBatchCode(batchCode)).thenReturn(Optional.of(dbBatch));

      BatchJobQueue queue = new BatchJobQueue(batchRepo, null, null, null);
      queue.createBatchJob(batchCode, "clinic-xyz", 10);

      queue.cancelBatch(batchCode);

      assertThat(queue.getBatchStatus(batchCode).status()).isEqualTo("CANCELLED");

      verify(batchRepo).save(dbBatch);
      assertThat(dbBatch.getStatus()).isEqualTo("CANCELLED");
    }
  }

  // =========================================================================
  // SUITE 4: AUD-01 & DAT-04 VERIFICATION
  // =========================================================================
  @Nested
  @DisplayName("Adversarial AUD-01 & DAT-04: Audit Propagation & Base64 Payload Optimization")
  class Aud01AndDat04Tests {

    @Test
    @DisplayName("AUD-01: AuditLogService.logEvent methods must declare Propagation.REQUIRES_NEW")
    void testAuditLogPropagationRequiresNew() {
      Method[] methods = AuditLogService.class.getDeclaredMethods();
      int logEventCount = 0;
      for (Method m : methods) {
        if (m.getName().equals("logEvent")) {
          Transactional tx = m.getAnnotation(Transactional.class);
          assertThat(tx).as("Method " + m + " must be annotated with @Transactional").isNotNull();
          assertThat(tx.propagation()).as("Method " + m + " must declare Propagation.REQUIRES_NEW").isEqualTo(Propagation.REQUIRES_NEW);
          logEventCount++;
        }
      }
      assertThat(logEventCount).as("Both logEvent overloads verified").isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("DAT-04: ScreeningResponse.fromEntitySummary replaces 15MB Base64 text with lightweight stream endpoint")
    void testScreeningSummaryReplacesHeavyBase64Payload() {
      UUID screeningId = UUID.randomUUID();
      Screening screening = new Screening(UUID.randomUUID(), "data:image/jpeg;base64," + "A".repeat(50000));
      org.springframework.test.util.ReflectionTestUtils.setField(screening, "id", screeningId);
      screening.setRiskScore(75);
      screening.setRiskLevel(RiskLevel.HIGH);
      screening.setStatus(ScreeningStatus.ANALYZED);
      screening.setHeatmapBase64("data:image/png;base64," + "H".repeat(10000));

      ScreeningResponse summary = ScreeningResponse.fromEntitySummary(screening);

      assertThat(summary).isNotNull();
      assertThat(summary.id()).isEqualTo(screeningId);
      assertThat(summary.imageUrl()).isEqualTo("/api/v1/screenings/" + screeningId + "/image");
      assertThat(summary.heatmapBase64()).isNull();
    }
  }
}
