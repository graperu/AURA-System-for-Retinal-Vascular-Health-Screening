package com.aura.bulk.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.bulk.dto.AiInferenceResultDto;
import com.aura.bulk.dto.PatientAnonymizedDto;
import com.aura.bulk.entity.BulkScreeningBatch;
import com.aura.bulk.entity.BulkScreeningItem;
import com.aura.bulk.queue.BatchItemTask;
import com.aura.bulk.queue.BatchJobQueue;
import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.bulk.repository.BulkScreeningItemRepository;
import com.aura.bulk.service.AiServiceClient;
import com.aura.clinic.entity.ClinicMember;
import com.aura.clinic.repository.ClinicMemberRepository;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientMedicalProfileRepository;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.screening.service.ScreeningService;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("Bulk Doctor Assignment & Worklist Linkage Adversarial Challenger Test Suite")
class BulkDoctorAssignmentChallengerTest {

  @Mock private BatchJobQueue jobQueue;
  @Mock private AiServiceClient aiServiceClient;
  @Mock private BulkScreeningItemRepository itemRepository;
  @Mock private BulkScreeningBatchRepository batchRepository;
  @Mock private RealtimeEventPublisher realtimeEventPublisher;
  @Mock private com.aura.billing.service.BillingService billingService;
  @Mock private ScreeningRepository screeningRepository;
  @Mock private PatientProfileRepository patientProfileRepository;
  @Mock private PatientMedicalProfileRepository patientMedicalProfileRepository;
  @Mock private UserRepository userRepository;
  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private ClinicMemberRepository clinicMemberRepository;

  private BulkProcessingWorker worker;
  private ScreeningService screeningService;

  private UUID clinicId;
  private UUID doctorId;
  private UUID patientId;
  private User clinicUser;
  private User doctorUser;
  private User patientUser;
  private BulkScreeningBatch batch;
  private BulkScreeningItem item;
  private BatchItemTask task;
  private AiInferenceResultDto aiResult;

  @BeforeEach
  void setUp() {
    worker = new BulkProcessingWorker(
        jobQueue,
        aiServiceClient,
        itemRepository,
        batchRepository,
        realtimeEventPublisher,
        billingService,
        screeningRepository,
        patientProfileRepository,
        patientMedicalProfileRepository,
        userRepository,
        assignmentRepository,
        clinicMemberRepository
    );

    screeningService = new ScreeningService(
        screeningRepository,
        assignmentRepository,
        null,
        null,
        clinicMemberRepository,
        userRepository,
        null,
        billingService,
        patientProfileRepository,
        patientMedicalProfileRepository
    );

    clinicId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();

    clinicUser = new User("clinic@aura.test", "hash", "Bệnh viện Mắt Quốc Tế AURA");
    ReflectionTestUtils.setField(clinicUser, "id", clinicId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. CKII Nguyễn Thị Thanh");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    patientUser = new User("patient_comm99@aura.local", "hash", "Trần Văn Sàng Lọc");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    batch = new BulkScreeningBatch("BATCH-COMM-99", clinicId, 1);
    ReflectionTestUtils.setField(batch, "id", UUID.randomUUID());

    item = new BulkScreeningItem(batch.getId(), "ITEM-99", "retina_fundus.png", "OD", "COMM-99");
    item.setRawMrn("MRN-COMM-99");
    item.setPatientName("Trần Văn Sàng Lọc");
    item.setPatientAge(52);
    item.setPatientGender("Nam");
    item.setSystolicBp(142);
    item.setDiastolicBp(92);

    PatientAnonymizedDto anonymized = new PatientAnonymizedDto(
        "COMM-99", "MRN-COMM-99", 52, "Nam", 142, 92, 6.8, true, false, Instant.now()
    );
    task = new BatchItemTask("BATCH-COMM-99", "ITEM-99", "retina_fundus.png", "OD", anonymized, "data:image/jpeg;base64,payload");

    aiResult = new AiInferenceResultDto(
        "COMM-99", 200L, 78, 52, "CRITICAL", 68, "HIGH", 28.5, 0.54, 14.2, 1.35, 0.45,
        "data:image/png;base64,cam_heatmap", 2, List.of("Tổn thương vi phình mạch", "Hẹp tiểu động mạch")
    );
  }

  private void invokeCreateAndPersistScreeningRecord(BatchItemTask t, BulkScreeningBatch b, BulkScreeningItem i, AiInferenceResultDto r) throws Exception {
    Method method = BulkProcessingWorker.class.getDeclaredMethod(
        "createAndPersistScreeningRecord",
        BatchItemTask.class,
        BulkScreeningBatch.class,
        BulkScreeningItem.class,
        AiInferenceResultDto.class
    );
    method.setAccessible(true);
    method.invoke(worker, t, b, i, r);
  }

  @Nested
  @DisplayName("1. Doctor-Patient Assignment & Profile Linkage Stress Tests")
  class DoctorAssignmentLinkageTests {

    @Test
    @DisplayName("Bulk screening item triggers DoctorPatientAssignment creation with ACTIVE status and clinicId")
    void shouldCreateDoctorPatientAssignmentCorrectly() throws Exception {
      ClinicMember member = new ClinicMember(clinicUser, doctorUser);
      when(clinicMemberRepository.findByClinicId(clinicId)).thenReturn(List.of(member));

      when(userRepository.save(any(User.class))).thenReturn(patientUser);
      when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
      when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

      when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE))
          .thenReturn(List.of());

      when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> {
        Screening s = inv.getArgument(0);
        ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
        return s;
      });

      invokeCreateAndPersistScreeningRecord(task, batch, item, aiResult);

      ArgumentCaptor<DoctorPatientAssignment> captor = ArgumentCaptor.forClass(DoctorPatientAssignment.class);
      verify(assignmentRepository).save(captor.capture());
      DoctorPatientAssignment saved = captor.getValue();

      assertThat(saved.getDoctor().getId()).isEqualTo(doctorId);
      assertThat(saved.getPatient().getId()).isEqualTo(patientId);
      assertThat(saved.getStatus()).isEqualTo(AssignmentStatus.ACTIVE);
      assertThat(saved.getAssignedBy()).isEqualTo(clinicId);
    }

    @Test
    @DisplayName("Duplicate Assignment Guard: Does not create duplicate assignment if already assigned to this doctor")
    void shouldNotCreateDuplicateAssignmentIfAlreadyAssigned() throws Exception {
      when(userRepository.save(any(User.class))).thenReturn(patientUser);
      when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

      DoctorPatientAssignment existingAssignment = new DoctorPatientAssignment(
          doctorUser, patientUser, AssignmentStatus.ACTIVE, clinicId
      );
      when(assignmentRepository.findByPatientIdAndStatus(patientId, AssignmentStatus.ACTIVE))
          .thenReturn(List.of(existingAssignment));

      when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

      invokeCreateAndPersistScreeningRecord(task, batch, item, aiResult);

      // Verify assignmentRepository.save was NEVER called because assignment already exists
      verify(assignmentRepository, never()).save(any(DoctorPatientAssignment.class));
    }

    @Test
    @DisplayName("Clinic Self-Assignment Guard: Does not create assignment if patient is the clinic itself")
    void shouldNotCreateAssignmentIfPatientIsClinic() throws Exception {
      ClinicMember member = new ClinicMember(clinicUser, doctorUser);
      when(clinicMemberRepository.findByClinicId(clinicId)).thenReturn(List.of(member));

      BulkScreeningItem itemWithoutMrn = new BulkScreeningItem(batch.getId(), "ITEM-NO-MRN", "retina.png", "OD", "ANON-01");
      itemWithoutMrn.setRawMrn(null); // No MRN -> resolveOrCreatePatientId falls back to clinicId

      BatchItemTask taskWithoutMrn = new BatchItemTask("BATCH-COMM-99", "ITEM-NO-MRN", "retina.png", "OD", null, "payload");

      when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

      invokeCreateAndPersistScreeningRecord(taskWithoutMrn, batch, itemWithoutMrn, aiResult);

      verify(assignmentRepository, never()).save(any(DoctorPatientAssignment.class));
    }

    @Test
    @DisplayName("PatientProfile is updated with doctor's full name, PENDING_REVIEW, findings, and score")
    void shouldSyncPatientProfileWithDoctorWorklist() throws Exception {
      ClinicMember member = new ClinicMember(clinicUser, doctorUser);
      when(clinicMemberRepository.findByClinicId(clinicId)).thenReturn(List.of(member));

      when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
      when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

      when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

      // Simulate existing profile
      PatientProfile existingProfile = new PatientProfile("MRN-COMM-99", "Trần Văn Sàng Lọc", 52, "Nam", "0912345678");
      existingProfile.setUserId(patientId);
      when(patientProfileRepository.findByMrn("MRN-COMM-99")).thenReturn(Optional.of(existingProfile));

      invokeCreateAndPersistScreeningRecord(task, batch, item, aiResult);

      ArgumentCaptor<PatientProfile> profileCaptor = ArgumentCaptor.forClass(PatientProfile.class);
      verify(patientProfileRepository).save(profileCaptor.capture());
      PatientProfile savedProfile = profileCaptor.getValue();

      assertThat(savedProfile.getAssignedDoctor()).isEqualTo("BS. CKII Nguyễn Thị Thanh");
      assertThat(savedProfile.getReviewStatus()).isEqualTo("PENDING_REVIEW");
      assertThat(savedProfile.getRiskScore()).isEqualTo(78);
      assertThat(savedProfile.getFindingsSummary()).contains("Tổn thương vi phình mạch");
      assertThat(savedProfile.getLastExamDate()).isNotEmpty();
    }

    @Test
    @DisplayName("Worker publishes STOMP event SCREENING_CREATED directly to /topic/doctor.{doctorId}")
    void shouldPublishStompToDoctorTopic() throws Exception {
      ClinicMember member = new ClinicMember(clinicUser, doctorUser);
      when(clinicMemberRepository.findByClinicId(clinicId)).thenReturn(List.of(member));

      when(userRepository.save(any(User.class))).thenReturn(patientUser);
      when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
      when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

      when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> {
        Screening s = inv.getArgument(0);
        ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
        return s;
      });

      invokeCreateAndPersistScreeningRecord(task, batch, item, aiResult);

      verify(realtimeEventPublisher).publish(eq("/topic/doctor." + doctorId), eq("SCREENING_CREATED"), any());
    }
  }

  @Nested
  @DisplayName("2. Doctor Worklist Integration Query Stress Tests")
  class DoctorWorklistQueryTests {

    @Test
    @DisplayName("ScreeningService.getScreeningsForDoctor includes bulk screening records matching doctorId")
    void getScreeningsForDoctor_shouldIncludeDirectDoctorIdMatch() {
      Pageable pageable = PageRequest.of(0, 10);

      // Simulate assigned patient IDs from assignmentRepository
      when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
          .thenReturn(List.of(patientId));

      when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
      when(patientProfileRepository.findByAssignedDoctor("BS. CKII Nguyễn Thị Thanh")).thenReturn(List.of());

      Screening bulkScreening = new Screening(patientId, "data:image/jpeg;base64,payload");
      bulkScreening.setDoctorId(doctorId);
      bulkScreening.setRiskScore(78);

      Page<Screening> page = new PageImpl<>(List.of(bulkScreening), pageable, 1);
      when(screeningRepository.findByDoctorIdOrPatientIdInOrderByCreatedAtDesc(
          eq(doctorId), eq(List.of(patientId)), eq(pageable)
      )).thenReturn(page);

      Page<Screening> result = screeningService.getScreeningsForDoctor(doctorId, pageable);

      assertThat(result).isNotEmpty();
      assertThat(result.getContent()).hasSize(1);
      assertThat(result.getContent().get(0).getDoctorId()).isEqualTo(doctorId);
      assertThat(result.getContent().get(0).getRiskScore()).isEqualTo(78);

      verify(screeningRepository).findByDoctorIdOrPatientIdInOrderByCreatedAtDesc(
          eq(doctorId), eq(List.of(patientId)), eq(pageable)
      );
    }
  }
}
