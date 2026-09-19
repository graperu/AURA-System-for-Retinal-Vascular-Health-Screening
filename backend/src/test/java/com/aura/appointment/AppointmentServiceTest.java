package com.aura.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.appointment.dto.AppointmentResponse;
import com.aura.appointment.dto.CreateAppointmentRequest;
import com.aura.appointment.dto.UpdateAppointmentStatusRequest;
import com.aura.appointment.entity.Appointment;
import com.aura.appointment.entity.AppointmentStatus;
import com.aura.appointment.repository.AppointmentRepository;
import com.aura.appointment.service.AppointmentService;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.entity.PatientProfile;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

  @Mock
  private AppointmentRepository appointmentRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private PatientProfileRepository patientProfileRepository;

  @Mock
  private RealtimeEventPublisher realtimeEventPublisher;

  private AppointmentService appointmentService;

  private UUID patientId;
  private UUID doctorId;
  private User patientUser;
  private User doctorUser;

  @BeforeEach
  void setUp() {
    appointmentService = new AppointmentService(
        appointmentRepository,
        userRepository,
        patientProfileRepository,
        realtimeEventPublisher
    );

    patientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();

    patientUser = new User("patient@aura.test", "hash", "Nguyễn Văn Bệnh Nhân");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. CKII Nguyễn Thị Thanh");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);
  }

  @Test
  @DisplayName("Tạo lịch hẹn thành công: lưu DB với trạng thái PENDING và phát sự kiện STOMP hai chiều")
  void createAppointment_withValidData_shouldCreatePendingAppointmentAndPublishStomp() {
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, tomorrow, "09:30", "Tư vấn tổn thương vi phình mạch", "Triệu chứng mờ mắt"
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, tomorrow, "09:30", AppointmentStatus.CANCELLED)).thenReturn(false);

    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> {
      Appointment a = invocation.getArgument(0);
      ReflectionTestUtils.setField(a, "id", UUID.randomUUID());
      return a;
    });

    PatientProfile profile = new PatientProfile("MRN-2026-9999", "Nguyễn Văn Bệnh Nhân", 45, "Nam", "0901234567");
    when(patientProfileRepository.findByUserId(patientId)).thenReturn(Optional.of(profile));

    AppointmentResponse response = appointmentService.createAppointment(patientId, req);

    assertThat(response).isNotNull();
    assertThat(response.patientId()).isEqualTo(patientId);
    assertThat(response.doctorId()).isEqualTo(doctorId);
    assertThat(response.doctorName()).isEqualTo("BS. CKII Nguyễn Thị Thanh");
    assertThat(response.patientMrn()).isEqualTo("MRN-2026-9999");
    assertThat(response.status()).isEqualTo(AppointmentStatus.PENDING);
    assertThat(response.timeSlot()).isEqualTo("09:30");
    assertThat(response.appointmentDate()).isEqualTo(tomorrow);

    verify(realtimeEventPublisher).publishAppointment(eq(doctorId), eq("APPOINTMENT_CREATED"), any());
    verify(realtimeEventPublisher).publishAppointment(eq(patientId), eq("APPOINTMENT_CREATED"), any());
  }

  @Test
  @DisplayName("Tạo lịch hẹn thất bại khi khung giờ đã có người đặt trước")
  void createAppointment_whenSlotTaken_shouldThrowIllegalStateException() {
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, tomorrow, "14:00", "Khám đáy mắt", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));
    when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        doctorId, tomorrow, "14:00", AppointmentStatus.CANCELLED)).thenReturn(true);

    assertThatThrownBy(() -> appointmentService.createAppointment(patientId, req))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("đã có người đặt trước");

    verify(appointmentRepository, never()).save(any());
  }

  @Test
  @DisplayName("Tạo lịch hẹn thất bại khi ngày hẹn trong quá khứ")
  void createAppointment_whenDateInPast_shouldThrowIllegalArgumentException() {
    LocalDate pastDate = LocalDate.now().minusDays(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, pastDate, "10:00", "Khám lại", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.of(doctorUser));

    assertThatThrownBy(() -> appointmentService.createAppointment(patientId, req))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Không thể đặt lịch hẹn trong quá khứ");
  }

  @Test
  @DisplayName("Tạo lịch hẹn thất bại khi không tìm thấy bác sĩ")
  void createAppointment_whenDoctorNotFound_shouldThrowResourceNotFoundException() {
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, LocalDate.now().plusDays(1), "10:00", "Khám", null
    );

    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(userRepository.findById(doctorId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> appointmentService.createAppointment(patientId, req))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy bác sĩ");
  }

  @Test
  @DisplayName("Bác sĩ xác nhận lịch hẹn (CONFIRMED): cập nhật trạng thái và phát STOMP")
  void updateStatus_byDoctor_confirmAppointment_shouldSucceedAndPublishStomp() {
    UUID appointmentId = UUID.randomUUID();
    Appointment appt = new Appointment(
        patientUser, doctorUser, LocalDate.now().plusDays(2), "10:30", "Tư vấn", null
    );
    ReflectionTestUtils.setField(appt, "id", appointmentId);

    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appt));
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CONFIRMED, "Đã chấp thuận lịch hẹn", null, null
    );

    AppointmentResponse res = appointmentService.updateStatus(
        appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
    );

    assertThat(res.status()).isEqualTo(AppointmentStatus.CONFIRMED);
    assertThat(res.notes()).contains("Đã chấp thuận lịch hẹn");

    verify(realtimeEventPublisher).publishAppointment(eq(doctorId), eq("APPOINTMENT_UPDATED"), any());
    verify(realtimeEventPublisher).publishAppointment(eq(patientId), eq("APPOINTMENT_UPDATED"), any());
  }

  @Test
  @DisplayName("Bệnh nhân hủy lịch hẹn của chính mình: thành công")
  void updateStatus_byPatient_cancelAppointment_shouldSucceed() {
    UUID appointmentId = UUID.randomUUID();
    Appointment appt = new Appointment(
        patientUser, doctorUser, LocalDate.now().plusDays(2), "10:30", "Tư vấn", null
    );
    ReflectionTestUtils.setField(appt, "id", appointmentId);

    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appt));
    when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CANCELLED, "Bận việc đột xuất", null, null
    );

    AppointmentResponse res = appointmentService.updateStatus(
        appointmentId, patientId, List.of("ROLE_USER"), req
    );

    assertThat(res.status()).isEqualTo(AppointmentStatus.CANCELLED);
  }

  @Test
  @DisplayName("Bệnh nhân cố ý xác nhận lịch hẹn (CONFIRMED) sẽ bị từ chối quyền")
  void updateStatus_byPatient_tryingToConfirm_shouldThrowAccessDeniedException() {
    UUID appointmentId = UUID.randomUUID();
    Appointment appt = new Appointment(
        patientUser, doctorUser, LocalDate.now().plusDays(2), "10:30", "Tư vấn", null
    );
    ReflectionTestUtils.setField(appt, "id", appointmentId);

    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appt));

    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CONFIRMED, null, null, null
    );

    assertThatThrownBy(() -> appointmentService.updateStatus(
        appointmentId, patientId, List.of("ROLE_USER"), req
    )).isInstanceOf(AccessDeniedException.class)
      .hasMessageContaining("Bệnh nhân chỉ có thể yêu cầu hủy lịch hẹn");
  }

  @Test
  @DisplayName("Người lạ không có quyền cập nhật lịch hẹn")
  void updateStatus_byUnauthorizedStranger_shouldThrowAccessDeniedException() {
    UUID appointmentId = UUID.randomUUID();
    Appointment appt = new Appointment(
        patientUser, doctorUser, LocalDate.now().plusDays(2), "10:30", "Tư vấn", null
    );
    ReflectionTestUtils.setField(appt, "id", appointmentId);

    when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(appt));

    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CANCELLED, null, null, null
    );

    UUID strangerId = UUID.randomUUID();
    assertThatThrownBy(() -> appointmentService.updateStatus(
        appointmentId, strangerId, List.of("ROLE_USER"), req
    )).isInstanceOf(AccessDeniedException.class);
  }

  @Test
  @DisplayName("Lấy danh sách các khung giờ đã đặt của bác sĩ loại trừ CANCELLED")
  void getBookedSlotsForDoctor_shouldExcludeCancelled() {
    LocalDate date = LocalDate.now().plusDays(1);
    Appointment appt1 = new Appointment(patientUser, doctorUser, date, "09:00", "Lý do 1", null);
    appt1.setStatus(AppointmentStatus.CONFIRMED);

    Appointment appt2 = new Appointment(patientUser, doctorUser, date, "10:00", "Lý do 2", null);
    appt2.setStatus(AppointmentStatus.CANCELLED);

    Appointment appt3 = new Appointment(patientUser, doctorUser, date, "14:00", "Lý do 3", null);
    appt3.setStatus(AppointmentStatus.PENDING);

    when(appointmentRepository.findByDoctorIdAndAppointmentDateOrderByTimeSlotAsc(doctorId, date))
        .thenReturn(List.of(appt1, appt2, appt3));

    List<String> slots = appointmentService.getBookedSlotsForDoctor(doctorId, date);

    assertThat(slots).containsExactly("09:00", "14:00");
  }

  @Test
  @DisplayName("getUpcomingAppointment - Lấy cuộc hẹn tương lai gần nhất còn hiệu lực")
  void getUpcomingAppointment_shouldReturnEarliestFutureValidAppointment() {
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    LocalDate nextWeek = LocalDate.now().plusDays(7);

    Appointment apptTomorrow = new Appointment(patientUser, doctorUser, tomorrow, "09:30", "Khám mắt", null);
    apptTomorrow.setStatus(AppointmentStatus.CONFIRMED);

    Appointment apptNextWeek = new Appointment(patientUser, doctorUser, nextWeek, "08:00", "Tái khám", null);
    apptNextWeek.setStatus(AppointmentStatus.PENDING);

    when(appointmentRepository.findByPatientIdOrderByAppointmentDateDescTimeSlotDesc(patientId))
        .thenReturn(List.of(apptNextWeek, apptTomorrow));

    AppointmentResponse upcoming = appointmentService.getUpcomingAppointment(patientId);

    assertThat(upcoming).isNotNull();
    assertThat(upcoming.appointmentDate()).isEqualTo(tomorrow);
    assertThat(upcoming.timeSlot()).isEqualTo("09:30");
  }
}
