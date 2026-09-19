package com.aura.bulk.worker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("BulkProcessingWorker Doctor Assignment & Worklist Sync Tests (R7)")
class BulkProcessingWorkerDoctorAssignmentTest {

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

  private UUID clinicId;
  private UUID doctorId;
  private User clinicUser;
  private User doctorUser;

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

    clinicId = UUID.randomUUID();
    doctorId = UUID.randomUUID();

    clinicUser = new User("clinic@aura.test", "hash", "Phòng khám Đa khoa AURA");
    ReflectionTestUtils.setField(clinicUser, "id", clinicId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. CKII Nguyễn Thị Thanh");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);
  }

  @Test
  @DisplayName("R7: Ca khám sàng lọc hàng loạt tự động liên kết DoctorPatientAssignment, đồng bộ PatientProfile và bắn STOMP cho bác sĩ")
  void createAndPersistScreeningRecord_shouldAssignDoctor_syncProfile_andPublishRealtime() throws Exception {
    BulkScreeningBatch batch = new BulkScreeningBatch("BATCH-COMMUNITY-01", clinicId, 1);
    ReflectionTestUtils.setField(batch, "id", UUID.randomUUID());

    BulkScreeningItem item = new BulkScreeningItem(batch.getId(), "ITEM-01", "fundus.png", "OD", "COMM-01");
    item.setRawMrn("MRN-COMM-01");
    item.setPatientName("Nguyễn Văn Cộng Đồng");
    item.setPatientAge(58);
    item.setPatientGender("Nam");
    item.setSystolicBp(138);
    item.setDiastolicBp(88);

    PatientAnonymizedDto patient = new PatientAnonymizedDto(
        "COMM-01", "MRN-COMM-01", 58, "Nam", 138, 88, 6.2, true, false, Instant.now()
    );
    BatchItemTask task = new BatchItemTask("BATCH-COMMUNITY-01", "ITEM-01", "fundus.png", "OD", patient, "b64_payload");

    AiInferenceResultDto aiResult = new AiInferenceResultDto(
        "COMM-01", 150L, 65, 45, "HIGH", 55, "HIGH", 22.5, 0.58, 16.5, 1.25, 0.42, "data:image/png;base64,heatmap", 1, List.of("Hẹp động mạch võng mạc")
    );

    // Mock clinic member resolution
    ClinicMember member = new ClinicMember(clinicUser, doctorUser);
    when(clinicMemberRepository.findByClinicId(clinicId)).thenReturn(List.of(member));

    UUID patientId = UUID.randomUUID();
    User patientUser = new User("patient_comm01@aura.local", "hash", "Nguyễn Văn Cộng Đồng");
    ReflectionTestUtils.setField(patientUser, "id", patientId);
    when(userRepository.save(any(User.class))).thenReturn(patientUser);
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    when(screeningRepository.save(any(Screening.class))).thenAnswer(i -> {
      Screening s = i.getArgument(0);
      ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
      return s;
    });

    // Invoke private createAndPersistScreeningRecord
    Method method = BulkProcessingWorker.class.getDeclaredMethod(
        "createAndPersistScreeningRecord",
        BatchItemTask.class,
        BulkScreeningBatch.class,
        BulkScreeningItem.class,
        AiInferenceResultDto.class
    );
    method.setAccessible(true);
    method.invoke(worker, task, batch, item, aiResult);

    // 1. Verify DoctorPatientAssignment persistence
    ArgumentCaptor<DoctorPatientAssignment> assignmentCaptor = ArgumentCaptor.forClass(DoctorPatientAssignment.class);
    verify(assignmentRepository).save(assignmentCaptor.capture());
    DoctorPatientAssignment savedAssignment = assignmentCaptor.getValue();
    assertThat(savedAssignment.getDoctor().getId()).isEqualTo(doctorId);
    assertThat(savedAssignment.getStatus()).isEqualTo(AssignmentStatus.ACTIVE);
    assertThat(savedAssignment.getAssignedBy()).isEqualTo(clinicId);

    // 2. Verify PatientProfile synchronization with doctor name
    ArgumentCaptor<PatientProfile> profileCaptor = ArgumentCaptor.forClass(PatientProfile.class);
    verify(patientProfileRepository).save(profileCaptor.capture());
    PatientProfile savedProfile = profileCaptor.getValue();
    assertThat(savedProfile.getAssignedDoctor()).isEqualTo("BS. CKII Nguyễn Thị Thanh");
    assertThat(savedProfile.getMrn()).isEqualTo("MRN-COMM-01");
    assertThat(savedProfile.getReviewStatus()).isEqualTo("PENDING_REVIEW");
    assertThat(savedProfile.getFullName()).isEqualTo("Nguyễn Văn Cộng Đồng");

    // 3. Verify STOMP publication to doctor topic
    verify(realtimeEventPublisher).publish(eq("/topic/doctor." + doctorId), eq("SCREENING_CREATED"), any());
  }
}
