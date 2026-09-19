package com.aura.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.appointment.dto.AppointmentResponse;
import com.aura.appointment.dto.UpdateAppointmentStatusRequest;
import com.aura.appointment.entity.Appointment;
import com.aura.appointment.entity.AppointmentStatus;
import com.aura.appointment.repository.AppointmentRepository;
import com.aura.appointment.service.AppointmentService;
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
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("Appointment Lifecycle & Permissions Adversarial Challenger Test Suite")
class AppointmentLifecycleChallengerTest {

  @Mock private AppointmentRepository appointmentRepository;
  @Mock private UserRepository userRepository;
  @Mock private PatientProfileRepository patientProfileRepository;
  @Mock private RealtimeEventPublisher realtimeEventPublisher;

  private AppointmentService appointmentService;

  private UUID appointmentId;
  private UUID patientId;
  private UUID doctorId;
  private UUID strangerPatientId;
  private UUID strangerDoctorId;
  private UUID adminId;

  private User patientUser;
  private User doctorUser;
  private User strangerPatientUser;
  private User strangerDoctorUser;
  private Appointment testAppointment;

  @BeforeEach
  void setUp() {
    appointmentService = new AppointmentService(
        appointmentRepository, userRepository, patientProfileRepository, realtimeEventPublisher
    );

    appointmentId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();
    strangerPatientId = UUID.randomUUID();
    strangerDoctorId = UUID.randomUUID();
    adminId = UUID.randomUUID();

    patientUser = new User("patient@aura.test", "hash", "Nguyễn Văn Bệnh Nhân");
    ReflectionTestUtils.setField(patientUser, "id", patientId);

    doctorUser = new User("doctor@aura.test", "hash", "BS. CKII Nguyễn Thị Thanh");
    ReflectionTestUtils.setField(doctorUser, "id", doctorId);

    strangerPatientUser = new User("stranger_pat@aura.test", "hash", "Trần Văn Lạ");
    ReflectionTestUtils.setField(strangerPatientUser, "id", strangerPatientId);

    strangerDoctorUser = new User("stranger_doc@aura.test", "hash", "BS. Lê Văn Khác");
    ReflectionTestUtils.setField(strangerDoctorUser, "id", strangerDoctorId);

    testAppointment = new Appointment(
        patientUser,
        doctorUser,
        LocalDate.now().plusDays(3),
        "09:30",
        "Khám định kỳ mạch máu võng mạc",
        "Ghi chú ban đầu"
    );
    testAppointment.setStatus(AppointmentStatus.PENDING);
    ReflectionTestUtils.setField(testAppointment, "id", appointmentId);
  }

  @Nested
  @DisplayName("1. Patient Permission Boundary Stress-Testing")
  class PatientPermissionTests {

    @Test
    @DisplayName("Patient CAN cancel own appointment -> status CANCELLED, dispatches STOMP")
    void patientCanCancelOwnAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CANCELLED, "Có việc gia đình đột xuất", null, null
      );

      AppointmentResponse res = appointmentService.updateStatus(
          appointmentId, patientId, List.of("ROLE_USER"), req
      );

      assertThat(res.status()).isEqualTo(AppointmentStatus.CANCELLED);
      assertThat(res.notes()).contains("Có việc gia đình đột xuất");
      verify(realtimeEventPublisher).publishAppointment(eq(doctorId), eq("APPOINTMENT_UPDATED"), any());
      verify(realtimeEventPublisher).publishAppointment(eq(patientId), eq("APPOINTMENT_UPDATED"), any());
    }

    @Test
    @DisplayName("Patient CANNOT confirm appointment -> throws AccessDeniedException")
    void patientCannotConfirmAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Bệnh nhân tự xác nhận", null, null
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, patientId, List.of("ROLE_USER"), req
      )).isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Bệnh nhân chỉ có thể yêu cầu hủy lịch hẹn");

      verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Patient CANNOT complete appointment -> throws AccessDeniedException")
    void patientCannotCompleteAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.COMPLETED, "Bệnh nhân tự hoàn thành khám", null, null
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, patientId, List.of("ROLE_USER"), req
      )).isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Bệnh nhân chỉ có thể yêu cầu hủy lịch hẹn");

      verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Patient CANNOT set appointment to PENDING -> throws AccessDeniedException")
    void patientCannotSetAppointmentToPending() {
      testAppointment.setStatus(AppointmentStatus.CONFIRMED);
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.PENDING, "Chuyển về pending", null, null
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, patientId, List.of("ROLE_USER"), req
      )).isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Bệnh nhân chỉ có thể yêu cầu hủy lịch hẹn");

      verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Stranger Patient CANNOT cancel another patient's appointment -> throws AccessDeniedException")
    void strangerPatientCannotCancelAnotherPatientsAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CANCELLED, "Hủy trộm của người khác", null, null
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, strangerPatientId, List.of("ROLE_USER"), req
      )).isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Bạn không có quyền cập nhật lịch hẹn này");

      verify(appointmentRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("2. Doctor Permission Lifecycle & Rescheduling Stress-Testing")
  class DoctorPermissionTests {

    @Test
    @DisplayName("Assigned Doctor CAN confirm appointment -> status CONFIRMED, dispatches STOMP")
    void assignedDoctorCanConfirmAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Bác sĩ đã duyệt lịch", null, null
      );

      AppointmentResponse res = appointmentService.updateStatus(
          appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
      );

      assertThat(res.status()).isEqualTo(AppointmentStatus.CONFIRMED);
      assertThat(res.notes()).contains("Bác sĩ đã duyệt lịch");
      verify(realtimeEventPublisher).publishAppointment(eq(doctorId), eq("APPOINTMENT_UPDATED"), any());
      verify(realtimeEventPublisher).publishAppointment(eq(patientId), eq("APPOINTMENT_UPDATED"), any());
    }

    @Test
    @DisplayName("Assigned Doctor CAN complete appointment -> status COMPLETED")
    void assignedDoctorCanCompleteAppointment() {
      testAppointment.setStatus(AppointmentStatus.CONFIRMED);
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.COMPLETED, "Đã hoàn thành khám và tư vấn chuyên sâu", null, null
      );

      AppointmentResponse res = appointmentService.updateStatus(
          appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
      );

      assertThat(res.status()).isEqualTo(AppointmentStatus.COMPLETED);
      assertThat(res.notes()).contains("Đã hoàn thành khám");
    }

    @Test
    @DisplayName("Assigned Doctor CAN cancel appointment -> status CANCELLED")
    void assignedDoctorCanCancelAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CANCELLED, "Bác sĩ bận ca phẫu thuật đột xuất", null, null
      );

      AppointmentResponse res = appointmentService.updateStatus(
          appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
      );

      assertThat(res.status()).isEqualTo(AppointmentStatus.CANCELLED);
    }

    @Test
    @DisplayName("Assigned Doctor CAN reschedule appointment to valid future slot")
    void assignedDoctorCanRescheduleAppointment() {
      LocalDate newDate = LocalDate.now().plusDays(5);
      String newSlot = "15:00";

      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
          doctorId, newDate, newSlot, AppointmentStatus.CANCELLED)).thenReturn(false);
      when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Dời sang chiều thứ Sáu", newDate, newSlot
      );

      AppointmentResponse res = appointmentService.updateStatus(
          appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
      );

      assertThat(res.status()).isEqualTo(AppointmentStatus.CONFIRMED);
      assertThat(res.appointmentDate()).isEqualTo(newDate);
      assertThat(res.timeSlot()).isEqualTo(newSlot);
      assertThat(res.notes()).contains("Dời sang chiều thứ Sáu");
    }

    @Test
    @DisplayName("Doctor CANNOT reschedule to a date in the past -> throws IllegalArgumentException")
    void doctorCannotRescheduleToPastDate() {
      LocalDate pastDate = LocalDate.now().minusDays(1);
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Dời về hôm qua", pastDate, "10:00"
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
      )).isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Không thể dời lịch hẹn về quá khứ");

      verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Doctor CANNOT reschedule to a slot already taken -> throws IllegalStateException")
    void doctorCannotRescheduleToOccupiedSlot() {
      LocalDate targetDate = LocalDate.now().plusDays(4);
      String occupiedSlot = "14:00";

      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
          doctorId, targetDate, occupiedSlot, AppointmentStatus.CANCELLED)).thenReturn(true);

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Dời vào giờ bận", targetDate, occupiedSlot
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, doctorId, List.of("ROLE_DOCTOR"), req
      )).isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Khung giờ mới đã có người đặt");

      verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Stranger Doctor CANNOT confirm, complete, cancel, or reschedule -> throws AccessDeniedException")
    void strangerDoctorCannotModifyAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Bác sĩ lạ can thiệp", null, null
      );

      assertThatThrownBy(() -> appointmentService.updateStatus(
          appointmentId, strangerDoctorId, List.of("ROLE_DOCTOR"), req
      )).isInstanceOf(AccessDeniedException.class)
        .hasMessageContaining("Bạn không có quyền cập nhật lịch hẹn này");

      verify(appointmentRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("3. Admin Role Permissions")
  class AdminPermissionTests {

    @Test
    @DisplayName("Admin CAN confirm, complete, cancel, or reschedule any appointment")
    void adminCanModifyAnyAppointment() {
      when(appointmentRepository.findById(appointmentId)).thenReturn(Optional.of(testAppointment));
      when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

      UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
          AppointmentStatus.CONFIRMED, "Quản trị viên duyệt", null, null
      );

      AppointmentResponse res = appointmentService.updateStatus(
          appointmentId, adminId, List.of("ROLE_ADMIN"), req
      );

      assertThat(res.status()).isEqualTo(AppointmentStatus.CONFIRMED);
      assertThat(res.notes()).contains("Quản trị viên duyệt");
    }
  }
}
