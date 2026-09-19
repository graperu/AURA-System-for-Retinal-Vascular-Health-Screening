package com.aura.challenger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.appointment.controller.AppointmentController;
import com.aura.appointment.dto.AppointmentResponse;
import com.aura.appointment.dto.CreateAppointmentRequest;
import com.aura.appointment.dto.UpdateAppointmentStatusRequest;
import com.aura.appointment.entity.Appointment;
import com.aura.appointment.entity.AppointmentStatus;
import com.aura.appointment.repository.AppointmentRepository;
import com.aura.appointment.service.AppointmentService;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.billing.service.BillingService;
import com.aura.bulk.worker.BulkProcessingWorker;
import com.aura.common.exception.GlobalExceptionHandler;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.doctor.entity.AssignmentStatus;
import com.aura.doctor.entity.DoctorPatientAssignment;
import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.screening.service.GeminiRetinalAiService;
import com.aura.screening.service.ScreeningService;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class Milestone1BackendEmpiricalChallengerTest {

  @Mock private AppointmentRepository appointmentRepository;
  @Mock private UserRepository userRepository;
  @Mock private PatientProfileRepository patientProfileRepository;
  @Mock private RealtimeEventPublisher realtimeEventPublisher;

  @Mock private ScreeningRepository screeningRepository;
  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private GeminiRetinalAiService geminiAiService;
  @Mock private BillingService billingService;

  private AppointmentService appointmentService;
  private ScreeningService screeningService;

  private UUID patientId;
  private UUID doctorId;
  private UUID clinicId;

  private User patientUser;
  private User doctorUser;
  private User clinicUser;

  @BeforeEach
  void setUp() {
    appointmentService = new AppointmentService(
        appointmentRepository, userRepository, patientProfileRepository, realtimeEventPublisher
    );

    screeningService = new ScreeningService(
        screeningRepository, assignmentRepository, null, null, null,
        userRepository, geminiAiService, billingService, null, null
    );

    patientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    clinicId = UUID.randomUUID();

    patientUser = new User("patient@aura.test", "hash", "Bệnh nhân Nguyễn Văn A");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. Trần Văn B");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    clinicUser = new User("clinic@aura.test", "hash", "Phòng Khám Đa Khoa AURA");
    ReflectionTestUtils.setField(clinicUser, "id", clinicId);
  }

  // =========================================================================
  // REQUIREMENT 1: APPOINTMENT SLOT COLLISION EMPIRICAL TESTS
  // =========================================================================

  @Test
  @DisplayName("CHALLENGE 1.1: Trùng slot đặt hẹn cùng bác sĩ, ngày, giờ -> Từ chối ném IllegalStateException")
  void test01_slotConflict_sequentialBooking_throwsIllegalStateException() {
    LocalDate targetDate = LocalDate.now().plusDays(2);
    String slot = "09:30";

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    // Slot has already been taken
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, targetDate, slot, AppointmentStatus.CANCELLED)).thenReturn(true);

    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, targetDate, slot, "Tư vấn", null
    );

    assertThatThrownBy(() -> appointmentService.createAppointment(patientId, req))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("đã có người đặt trước");

    verify(appointmentRepository, never()).save(any());
  }

  @Test
  @DisplayName("CHALLENGE 1.2: Đặt lại slot đã bị HỦY (CANCELLED) -> Cho phép thành công")
  void test02_slotConflict_cancelledAppointment_allowsSlotRebooking() {
    LocalDate targetDate = LocalDate.now().plusDays(2);
    String slot = "10:00";

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    // When status is CANCELLED, exists... returns false because CANCELLED is excluded
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, targetDate, slot, AppointmentStatus.CANCELLED)).thenReturn(false);

    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
      Appointment a = inv.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, targetDate, slot, "Tư vấn sau khi hủy", null
    );

    AppointmentResponse response = appointmentService.createAppointment(patientId, req);

    assertThat(response).isNotNull();
    assertThat(response.timeSlot()).isEqualTo("10:00");
    assertThat(response.status()).isEqualTo(AppointmentStatus.PENDING);
    verify(appointmentRepository).save(any(Appointment.class));
  }

  @Test
  @DisplayName("CHALLENGE 1.3: Cùng ngày và khung giờ nhưng KHÁC bác sĩ -> Thành công không xung đột")
  void test03_slotConflict_differentDoctorSameSlot_succeeds() {
    LocalDate targetDate = LocalDate.now().plusDays(3);
    String slot = "14:00";
    UUID otherDoctorId = UUID.randomUUID();
    User otherDoctor = new User("doctor2@aura.test", "hash", "BS. Lê Thị C");
    ReflectionTestUtils.setField(otherDoctor, "id", otherDoctorId);

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(otherDoctorId)).thenReturn(Optional.of(otherDoctor));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        otherDoctorId, targetDate, slot, AppointmentStatus.CANCELLED)).thenReturn(false);
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
      Appointment a = inv.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    CreateAppointmentRequest req = new CreateAppointmentRequest(
        otherDoctorId, targetDate, slot, "Khám bác sĩ khác", null
    );

    AppointmentResponse res = appointmentService.createAppointment(patientId, req);

    assertThat(res.doctorId()).isEqualTo(otherDoctorId);
    assertThat(res.doctorName()).isEqualTo("BS. Lê Thị C");
  }

  @Test
  @DisplayName("CHALLENGE 1.4: Cùng bác sĩ, cùng khung giờ nhưng KHÁC ngày -> Thành công không xung đột")
  void test04_slotConflict_differentDateSameDoctorSameSlot_succeeds() {
    LocalDate date1 = LocalDate.now().plusDays(1);
    LocalDate date2 = LocalDate.now().plusDays(2);
    String slot = "15:00";

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, date2, slot, AppointmentStatus.CANCELLED)).thenReturn(false);
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
      Appointment a = inv.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, date2, slot, "Khám ngày tiếp theo", null
    );

    AppointmentResponse res = appointmentService.createAppointment(patientId, req);

    assertThat(res.appointmentDate()).isEqualTo(date2);
  }

  @Test
  @DisplayName("CHALLENGE 1.5: Dời lịch (Reschedule) sang khung giờ đã có người đặt -> Ném IllegalStateException")
  void test05_reschedule_toOccupiedSlot_throwsIllegalStateException() {
    UUID appointmentId = UUID.randomUUID();
    Appointment appt = new Appointment(
        patientUser, doctorUser, LocalDate.now().plusDays(2), "09:00", "Lý do", null
    );
    ReflectionTestUtils.setField(appt, "id", appointmentId);

    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appt));

    LocalDate newDate = LocalDate.now().plusDays(5);
    String newSlot = "10:30";

    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, newDate, newSlot, AppointmentStatus.CANCELLED)).thenReturn(true);

    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CONFIRMED, "Dời lịch", newDate, newSlot
    );

    assertThatThrownBy(() -> appointmentService.updateStatus(
        appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
    )).isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("Khung giờ mới đã có người đặt");

    verify(appointmentRepository, never()).save(any());
  }

  @Test
  @DisplayName("CHALLENGE 1.6 (Adversarial): Dời lịch về chính ngày giờ hiện tại của mình -> Bị phát hiện trùng lặp tự thân do thiếu loại trừ ID")
  void test06_reschedule_toOwnCurrentSlot_revealsSelfCollisionDueToMissingIdExclusion() {
    UUID appointmentId = UUID.randomUUID();
    LocalDate curDate = LocalDate.now().plusDays(3);
    String curSlot = "11:00";
    Appointment appt = new Appointment(patientUser, doctorUser, curDate, curSlot, "Lý do", null);
    ReflectionTestUtils.setField(appt, "id", appointmentId);

    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appt));

    // When checking existsBy... with curDate and curSlot, DB returns true because THIS appointment exists
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, curDate, curSlot, AppointmentStatus.CANCELLED)).thenReturn(true);

    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CONFIRMED, "Giữ nguyên giờ", curDate, curSlot
    );

    // Documents this empirical finding: without id != currentId in the check, self-reschedule is rejected
    assertThatThrownBy(() -> appointmentService.updateStatus(
        appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
    )).isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("Khung giờ mới đã có người đặt");
  }

  @Test
  @DisplayName("CHALLENGE 1.7 (Concurrency Stress): Hai luồng đồng thời tranh chấp một khung giờ -> Cần cơ chế khóa bi quan hoặc partial unique index")
  void test07_concurrentSlotBooking_raceConditionSimulation() throws Exception {
    LocalDate targetDate = LocalDate.now().plusDays(4);
    String slot = "16:00";

    when(userRepository.findById(any())).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    // Simulate thread race: first thread gets false, second thread also gets false before first saves
    AtomicInteger checkCount = new AtomicInteger(0);
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        eq(doctorId), eq(targetDate), eq(slot), eq(AppointmentStatus.CANCELLED)))
        .thenAnswer(inv -> checkCount.incrementAndGet() > 1);

    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
      Appointment a = inv.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, targetDate, slot, "Tranh chấp", null
    );

    ExecutorService executor = Executors.newFixedThreadPool(2);
    CountDownLatch latch = new CountDownLatch(1);
    AtomicInteger successes = new AtomicInteger(0);
    AtomicInteger rejections = new AtomicInteger(0);

    for (int i = 0; i < 2; i++) {
      executor.submit(() -> {
        try {
          latch.await();
          appointmentService.createAppointment(patientId, req);
          successes.incrementAndGet();
        } catch (IllegalStateException ex) {
          rejections.incrementAndGet();
        } catch (Exception ex) {
          // unexpected
        }
      });
    }

    latch.countDown();
    executor.shutdown();
    executor.awaitTermination(3, java.util.concurrent.TimeUnit.SECONDS);

    assertThat(successes.get() + rejections.get()).isEqualTo(2);
  }

  // =========================================================================
  // REQUIREMENT 2: PAST APPOINTMENT DATE VALIDATION EMPIRICAL TESTS
  // =========================================================================

  @Test
  @DisplayName("CHALLENGE 2.1: Ngày hẹn là ngày hôm qua -> Ném IllegalArgumentException 'Không thể đặt lịch hẹn trong quá khứ'")
  void test08_pastDate_yesterday_throwsIllegalArgumentException() {
    LocalDate yesterday = LocalDate.now().minusDays(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, yesterday, "08:30", "Khám lại", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    assertThatThrownBy(() -> appointmentService.createAppointment(patientId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Không thể đặt lịch hẹn trong quá khứ");

    verify(appointmentRepository, never()).save(any());
  }

  @Test
  @DisplayName("CHALLENGE 2.2: Ngày hẹn cách đây 1 năm -> Ném IllegalArgumentException")
  void test09_pastDate_ancientDate_throwsIllegalArgumentException() {
    LocalDate lastYear = LocalDate.now().minusYears(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, lastYear, "10:00", "Khám", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    assertThatThrownBy(() -> appointmentService.createAppointment(patientId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Không thể đặt lịch hẹn trong quá khứ");
  }

  @Test
  @DisplayName("CHALLENGE 2.3: Dời lịch (Reschedule) về ngày trong quá khứ -> Ném IllegalArgumentException")
  void test10_reschedule_toPastDate_throwsIllegalArgumentException() {
    UUID apptId = UUID.randomUUID();
    Appointment appt = new Appointment(
        patientUser, doctorUser, LocalDate.now().plusDays(3), "09:00", "Lý do", null
    );
    ReflectionTestUtils.setField(appt, "id", apptId);

    when(appointmentRepository.findById(apptId)).thenReturn(Optional.of(appt));

    LocalDate pastDate = LocalDate.now().minusDays(2);
    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CONFIRMED, "Dời về quá khứ", pastDate, "14:00"
    );

    assertThatThrownBy(() -> appointmentService.updateStatus(
        apptId, doctorId, List.of("ROLE_DOCTOR"), req
    )).isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining("Không thể dời lịch hẹn về quá khứ");
  }

  @Test
  @DisplayName("CHALLENGE 2.4: Ngày hẹn là hôm nay (CURRENT_DATE) -> Cho phép thành công")
  void test11_validDate_today_succeeds() {
    LocalDate today = LocalDate.now();
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, today, "15:30", "Khám trong ngày", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, today, "15:30", AppointmentStatus.CANCELLED)).thenReturn(false);
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
      Appointment a = inv.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    AppointmentResponse res = appointmentService.createAppointment(patientId, req);

    assertThat(res).isNotNull();
    assertThat(res.appointmentDate()).isEqualTo(today);
  }

  @Test
  @DisplayName("CHALLENGE 2.5: Ngày hẹn trong tương lai -> Cho phép thành công")
  void test12_validDate_future_succeeds() {
    LocalDate future = LocalDate.now().plusMonths(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, future, "11:00", "Khám định kỳ tháng sau", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, future, "11:00", AppointmentStatus.CANCELLED)).thenReturn(false);
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> {
      Appointment a = inv.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    AppointmentResponse res = appointmentService.createAppointment(patientId, req);

    assertThat(res).isNotNull();
    assertThat(res.appointmentDate()).isEqualTo(future);
  }

  // =========================================================================
  // REQUIREMENT 3: ZERO-CREDIT CLINIC SCREENING REJECTION EMPIRICAL TESTS
  // =========================================================================

  @Test
  @DisplayName("CHALLENGE 3.1: Tài khoản CLINIC có remainingCredits = 0 -> Từ chối tạo ca sàng lọc và ném PaymentFailedException")
  void test13_clinicScreening_zeroCredits_throwsPaymentFailedException() {
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(
        clinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(clinicPrincipal, null, clinicPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(0);

    CreateScreeningRequest req = new CreateScreeningRequest("https://cdn.aura.test/fundus_zero.png");

    assertThatThrownBy(() -> screeningService.createScreening(clinicId, req))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("không đủ lượt quét khả dụng (Hiện có 0)");

    verify(billingService, never()).deductCredits(any(), anyInt());
    verify(screeningRepository, never()).save(any());
  }

  @Test
  @DisplayName("CHALLENGE 3.2: Tài khoản CLINIC có remainingCredits < 0 (âm) -> Vẫn từ chối và ném PaymentFailedException")
  void test14_clinicScreening_negativeCredits_throwsPaymentFailedException() {
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(
        clinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(clinicPrincipal, null, clinicPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(-3);

    CreateScreeningRequest req = new CreateScreeningRequest("https://cdn.aura.test/fundus_neg.png");

    assertThatThrownBy(() -> screeningService.createScreening(clinicId, req))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("không đủ lượt quét khả dụng (Hiện có -3)");

    verify(billingService, never()).deductCredits(any(), anyInt());
  }

  @Test
  @DisplayName("CHALLENGE 3.3: Request truyền trực tiếp clinicId của phòng khám có 0 credits -> Ném PaymentFailedException")
  void test15_clinicScreening_explicitClinicIdWithZeroCredits_throwsPaymentFailedException() {
    UUID otherPatientId = UUID.randomUUID();
    AuraUserPrincipal patientPrincipal = new AuraUserPrincipal(
        otherPatientId, "patient@aura.test", "secret", true, List.of("ROLE_USER")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(patientPrincipal, null, patientPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(0);

    CreateScreeningRequest req = new CreateScreeningRequest(
        "https://cdn.aura.test/fundus_clinic.png", "OD", "Fundus", "fundus.png", 1024L, "image/png",
        null, null, null, clinicId
    );

    assertThatThrownBy(() -> screeningService.createScreening(otherPatientId, req))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("không đủ lượt quét khả dụng (Hiện có 0)");

    verify(billingService, never()).deductCredits(any(), anyInt());
  }

  @Test
  @DisplayName("CHALLENGE 3.4: Tài khoản CLINIC có 5 credits -> Trừ thành công 1 credit")
  void test16_clinicScreening_sufficientCredits_deductsCreditSuccessfully() {
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(
        clinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(clinicPrincipal, null, clinicPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(5);
    when(billingService.deductCredits(clinicId, 1)).thenReturn(true);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(java.util.Map.of(
        "overallVascularRiskScore", 45,
        "confidence", 0.95
    ));

    CreateScreeningRequest req = new CreateScreeningRequest("https://cdn.aura.test/fundus_good.png");

    Screening saved = screeningService.createScreening(clinicId, req);

    assertThat(saved).isNotNull();
    assertThat(saved.getClinicId()).isEqualTo(clinicId);
    verify(billingService).deductCredits(clinicId, 1);
    verify(billingService, never()).refundCredit(any(), anyInt());
  }

  @Test
  @DisplayName("CHALLENGE 3.5: Trừ 1 credit thành công nhưng AI gặp lỗi FAILED -> Tự động hoàn trả 1 credit cho phòng khám")
  void test17_clinicScreening_creditDeducted_thenAiFails_refundsCredit() {
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(
        clinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(clinicPrincipal, null, clinicPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(2);
    when(billingService.deductCredits(clinicId, 1)).thenReturn(true);
    when(screeningRepository.save(any(Screening.class))).thenAnswer(inv -> inv.getArgument(0));

    // AI returns empty map -> causes ScreeningStatus.FAILED
    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(Collections.emptyMap());

    CreateScreeningRequest req = new CreateScreeningRequest("https://cdn.aura.test/fundus_fail.png");

    Screening saved = screeningService.createScreening(clinicId, req);

    assertThat(saved.getStatus()).isEqualTo(ScreeningStatus.FAILED);
    verify(billingService).deductCredits(clinicId, 1);
    verify(billingService).refundCredit(clinicId, 1);
  }

  @Test
  @DisplayName("CHALLENGE 3.6: Khóa bi quan trả về false khi trừ credit -> Ném PaymentFailedException")
  void test18_clinicScreening_deductCreditsReturnsFalse_throwsPaymentFailedException() {
    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(
        clinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(clinicPrincipal, null, clinicPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(1);
    when(billingService.deductCredits(clinicId, 1)).thenReturn(false);

    CreateScreeningRequest req = new CreateScreeningRequest("https://cdn.aura.test/fundus_race.png");

    assertThatThrownBy(() -> screeningService.createScreening(clinicId, req))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("không đủ lượt quét khả dụng");

    verify(screeningRepository, never()).save(any());
  }

  // =========================================================================
  // REQUIREMENT 4: HTTP / MOCKMVC EXCEPTION TRANSLATION EMPIRICAL TESTS
  // =========================================================================

  private MockMvc buildMockMvc(AppointmentController controller, AuraUserPrincipal principal) {
    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
    mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter =
        new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(mapper);

    return MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new GlobalExceptionHandler())
        .setMessageConverters(converter)
        .setCustomArgumentResolvers(new org.springframework.web.method.support.HandlerMethodArgumentResolver() {
          @Override
          public boolean supportsParameter(org.springframework.core.MethodParameter parameter) {
            return parameter.getParameterType().isAssignableFrom(AuraUserPrincipal.class);
          }

          @Override
          public Object resolveArgument(org.springframework.core.MethodParameter parameter,
                                        org.springframework.web.method.support.ModelAndViewContainer mavContainer,
                                        org.springframework.web.context.request.NativeWebRequest webRequest,
                                        org.springframework.web.bind.support.WebDataBinderFactory binderFactory) {
            return principal;
          }
        })
        .build();
  }

  @Test
  @DisplayName("CHALLENGE 4.1 (Empirical Observation): Thử nghiệm MockMvc gọi POST /api/v1/appointments khi trùng slot -> Xác nhận HTTP Response")
  void test19_mockMvc_slotConflictException_responseInspection() throws Exception {
    AppointmentController controller = new AppointmentController(appointmentService);
    AuraUserPrincipal patientPrincipal = new AuraUserPrincipal(patientId, "patient@aura.test", "secret", true, List.of("ROLE_USER"));
    MockMvc mockMvc = buildMockMvc(controller, patientPrincipal);

    LocalDate targetDate = LocalDate.now().plusDays(2);
    String slot = "09:30";

    when(userRepository.findById(any())).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, targetDate, slot, AppointmentStatus.CANCELLED)).thenReturn(true);

    // Calling via MockMvc:
    // When slot is taken, AppointmentService throws IllegalStateException.
    // In GlobalExceptionHandler, there is no @ExceptionHandler(IllegalStateException.class).
    // Therefore, it falls through to @ExceptionHandler(Exception.class) which returns 500 INTERNAL_SERVER_ERROR.
    mockMvc.perform(post("/api/v1/appointments")
            .contentType(MediaType.APPLICATION_JSON)
            .content(String.format("""
                {
                  "doctorId": "%s",
                  "appointmentDate": "%s",
                  "timeSlot": "%s",
                  "reason": "Khám mắt"
                }
                """, doctorId, targetDate, slot)))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code").value("INTERNAL_SERVER_ERROR"))
        .andExpect(jsonPath("$.message").value("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."));
  }

  @Test
  @DisplayName("CHALLENGE 4.2: Thử nghiệm MockMvc khi ngày hẹn trong quá khứ -> Trả về HTTP 400 Bad Request")
  void test20_mockMvc_pastDateException_returns400() throws Exception {
    AppointmentController controller = new AppointmentController(appointmentService);
    AuraUserPrincipal patientPrincipal = new AuraUserPrincipal(patientId, "patient@aura.test", "secret", true, List.of("ROLE_USER"));
    MockMvc mockMvc = buildMockMvc(controller, patientPrincipal);

    LocalDate pastDate = LocalDate.now().minusDays(1);

    when(userRepository.findById(any())).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    mockMvc.perform(post("/api/v1/appointments")
            .contentType(MediaType.APPLICATION_JSON)
            .content(String.format("""
                {
                  "doctorId": "%s",
                  "appointmentDate": "%s",
                  "timeSlot": "09:00",
                  "reason": "Khám quá khứ"
                }
                """, doctorId, pastDate)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
        .andExpect(jsonPath("$.message").value("Không thể đặt lịch hẹn trong quá khứ"));
  }

  @Test
  @DisplayName("CHALLENGE 4.3: Controller khi phòng khám hết credit -> Ném PaymentFailedException")
  void test23_controller_zeroCreditClinicScreening_throwsPaymentFailedException() {
    com.aura.auth.service.PatientAccessService accessService = mock(com.aura.auth.service.PatientAccessService.class);
    com.aura.screening.controller.ScreeningController screeningController =
        new com.aura.screening.controller.ScreeningController(screeningService, accessService);

    AuraUserPrincipal clinicPrincipal = new AuraUserPrincipal(
        clinicId, "clinic@aura.test", "secret", true, List.of("ROLE_CLINIC")
    );
    SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(clinicPrincipal, null, clinicPrincipal.getAuthorities())
    );

    when(billingService.getRemainingCredits(clinicId)).thenReturn(0);

    CreateScreeningRequest req = new CreateScreeningRequest("https://cdn.aura.test/clinic_scan.png");

    assertThatThrownBy(() -> screeningController.createScreening(clinicPrincipal, req))
        .isInstanceOf(PaymentFailedException.class)
        .hasMessageContaining("Cơ sở y tế không đủ lượt quét khả dụng (Hiện có 0)");
  }

  // =========================================================================
  // REQUIREMENT 5: BULK SCREENING DOCTOR ASSIGNMENT & WORKLIST SYNC TESTS
  // =========================================================================

  @Test
  @DisplayName("CHALLENGE 5.1: Bác sĩ chưa được phân công bệnh nhân -> getScreeningsForDoctor vẫn truy vấn screening.doctorId")
  void test21_getScreeningsForDoctor_queriesByDoctorIdDirectly() {
    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(Collections.emptyList());

    Pageable pageable = PageRequest.of(0, 10);
    Screening screening = new Screening(UUID.randomUUID(), "https://cdn.aura.test/bulk_fundus.png");
    screening.setDoctorId(doctorId);

    when(screeningRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable))
        .thenReturn(new PageImpl<>(List.of(screening)));

    Page<Screening> result = screeningService.getScreeningsForDoctor(doctorId, pageable);

    assertThat(result).isNotNull();
    assertThat(result.getContent()).hasSize(1);
    assertThat(result.getContent().get(0).getDoctorId()).isEqualTo(doctorId);
    verify(screeningRepository).findByDoctorIdOrderByCreatedAtDesc(doctorId, pageable);
  }

  @Test
  @DisplayName("CHALLENGE 5.2: Bác sĩ có bệnh nhân được phân công -> getScreeningsForDoctor kết hợp doctorId hoặc patientIds")
  void test22_getScreeningsForDoctor_queriesDoctorIdOrPatientIds() {
    UUID assignedPatient = UUID.randomUUID();
    when(assignmentRepository.findPatientIdsByDoctorIdAndStatus(doctorId, AssignmentStatus.ACTIVE))
        .thenReturn(List.of(assignedPatient));

    Pageable pageable = PageRequest.of(0, 10);
    when(screeningRepository.findByDoctorIdOrPatientIdInOrderByCreatedAtDesc(
        eq(doctorId), eq(List.of(assignedPatient)), eq(pageable)
    )).thenReturn(Page.empty(pageable));

    Page<Screening> result = screeningService.getScreeningsForDoctor(doctorId, pageable);

    assertThat(result).isNotNull();
    verify(screeningRepository).findByDoctorIdOrPatientIdInOrderByCreatedAtDesc(
        eq(doctorId), eq(List.of(assignedPatient)), eq(pageable)
    );
  }
}
