package com.aura.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.appointment.controller.AppointmentController;
import com.aura.appointment.dto.AppointmentResponse;
import com.aura.appointment.dto.CreateAppointmentRequest;
import com.aura.appointment.dto.UpdateAppointmentStatusRequest;
import com.aura.appointment.entity.AppointmentStatus;
import com.aura.appointment.service.AppointmentService;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ApiResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {

  @Mock
  private AppointmentService appointmentService;

  private AppointmentController controller;

  private UUID patientId;
  private UUID doctorId;
  private AuraUserPrincipal patientPrincipal;
  private AuraUserPrincipal doctorPrincipal;
  private AuraUserPrincipal adminPrincipal;

  @BeforeEach
  void setUp() {
    controller = new AppointmentController(appointmentService);

    patientId = UUID.randomUUID();
    doctorId = UUID.randomUUID();

    patientPrincipal = new AuraUserPrincipal(
        patientId, "patient@aura.test", "secret", true, List.of("ROLE_USER")
    );
    doctorPrincipal = new AuraUserPrincipal(
        doctorId, "doctor@aura.test", "secret", true, List.of("ROLE_DOCTOR")
    );
    adminPrincipal = new AuraUserPrincipal(
        UUID.randomUUID(), "admin@aura.test", "secret", true, List.of("ROLE_ADMIN")
    );
  }

  @Test
  @DisplayName("POST /api/v1/appointments - Bệnh nhân đặt lịch thành công")
  void createAppointment_whenAuthenticated_shouldReturnSuccess() {
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, tomorrow, "09:00", "Khám mắt", null
    );

    AppointmentResponse expected = new AppointmentResponse(
        UUID.randomUUID(), patientId, "Nguyễn Văn A", "patient@aura.test", "MRN-101",
        doctorId, "BS. Thanh", tomorrow, "09:00", "Khám mắt", null,
        AppointmentStatus.PENDING, Instant.now(), Instant.now()
    );

    when(appointmentService.createAppointment(eq(patientId), eq(req))).thenReturn(expected);

    ApiResponse<AppointmentResponse> response = controller.createAppointment(patientPrincipal, req);

    assertThat(response.success()).isTrue();
    assertThat(response.data()).isEqualTo(expected);
    assertThat(response.message()).contains("thành công");
    verify(appointmentService).createAppointment(patientId, req);
  }

  @Test
  @DisplayName("POST /api/v1/appointments - Yêu cầu đăng nhập khi chưa xác thực")
  void createAppointment_whenAnonymous_shouldThrowAuthException() {
    CreateAppointmentRequest req = new CreateAppointmentRequest(
        doctorId, LocalDate.now().plusDays(1), "09:00", null, null
    );

    assertThatThrownBy(() -> controller.createAppointment(null, req))
        .isInstanceOf(AuthException.class);
  }

  @Test
  @DisplayName("GET /api/v1/appointments - Bệnh nhân xem lịch hẹn của mình")
  void getAppointments_asPatient_shouldCallPatientService() {
    AppointmentResponse sample = new AppointmentResponse(
        UUID.randomUUID(), patientId, "Nguyễn Văn A", "patient@aura.test", "MRN-101",
        doctorId, "BS. Thanh", LocalDate.now(), "09:00", "Khám mắt", null,
        AppointmentStatus.PENDING, Instant.now(), Instant.now()
    );
    when(appointmentService.getAppointmentsForPatient(patientId)).thenReturn(List.of(sample));

    ApiResponse<List<AppointmentResponse>> res = controller.getAppointments(patientPrincipal);

    assertThat(res.success()).isTrue();
    assertThat(res.data()).hasSize(1);
    verify(appointmentService).getAppointmentsForPatient(patientId);
  }

  @Test
  @DisplayName("GET /api/v1/appointments - Bác sĩ xem danh sách tư vấn")
  void getAppointments_asDoctor_shouldCallDoctorService() {
    AppointmentResponse sample = new AppointmentResponse(
        UUID.randomUUID(), patientId, "Nguyễn Văn A", "patient@aura.test", "MRN-101",
        doctorId, "BS. Thanh", LocalDate.now(), "09:00", "Khám mắt", null,
        AppointmentStatus.CONFIRMED, Instant.now(), Instant.now()
    );
    when(appointmentService.getAppointmentsForDoctor(doctorId)).thenReturn(List.of(sample));

    ApiResponse<List<AppointmentResponse>> res = controller.getAppointments(doctorPrincipal);

    assertThat(res.success()).isTrue();
    assertThat(res.data()).hasSize(1);
    verify(appointmentService).getAppointmentsForDoctor(doctorId);
  }

  @Test
  @DisplayName("GET /api/v1/appointments - Admin xem toàn bộ lịch hẹn")
  void getAppointments_asAdmin_shouldCallAllAppointments() {
    when(appointmentService.getAllAppointments()).thenReturn(List.of());

    ApiResponse<List<AppointmentResponse>> res = controller.getAppointments(adminPrincipal);

    assertThat(res.success()).isTrue();
    verify(appointmentService).getAllAppointments();
  }

  @Test
  @DisplayName("GET /api/v1/appointments/doctor/{doctorId}/slots - Xem khung giờ đã đặt")
  void getBookedSlots_shouldReturnSlots() {
    LocalDate date = LocalDate.now().plusDays(2);
    when(appointmentService.getBookedSlotsForDoctor(doctorId, date))
        .thenReturn(List.of("09:00", "14:30"));

    ApiResponse<List<String>> res = controller.getBookedSlots(doctorId, date);

    assertThat(res.success()).isTrue();
    assertThat(res.data()).containsExactly("09:00", "14:30");
  }

  @Test
  @DisplayName("PATCH /api/v1/appointments/{id}/status - Cập nhật trạng thái lịch hẹn")
  void updateStatus_shouldCallService() {
    UUID apptId = UUID.randomUUID();
    UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest(
        AppointmentStatus.CONFIRMED, "Bác sĩ đồng ý", null, null
    );

    AppointmentResponse updated = new AppointmentResponse(
        apptId, patientId, "Nguyễn Văn A", "patient@aura.test", "MRN-101",
        doctorId, "BS. Thanh", LocalDate.now(), "09:00", "Khám mắt", "Bác sĩ đồng ý",
        AppointmentStatus.CONFIRMED, Instant.now(), Instant.now()
    );
    when(appointmentService.updateStatus(eq(apptId), eq(doctorId), eq(doctorPrincipal.roles()), eq(req)))
        .thenReturn(updated);

    ApiResponse<AppointmentResponse> res = controller.updateStatus(apptId, doctorPrincipal, req);

    assertThat(res.success()).isTrue();
    assertThat(res.data().status()).isEqualTo(AppointmentStatus.CONFIRMED);
    verify(appointmentService).updateStatus(apptId, doctorId, doctorPrincipal.roles(), req);
  }

  @Test
  @DisplayName("GET /api/v1/appointments/upcoming - Lấy lịch hẹn sắp tới thành công")
  void getUpcomingAppointment_shouldReturnUpcoming() {
    AppointmentResponse sample = new AppointmentResponse(
        UUID.randomUUID(), patientId, "Nguyễn Văn A", "patient@aura.test", "MRN-101",
        doctorId, "BS. Thanh", LocalDate.now().plusDays(1), "10:00", "Khám mắt", null,
        AppointmentStatus.CONFIRMED, Instant.now(), Instant.now()
    );
    when(appointmentService.getUpcomingAppointment(patientId)).thenReturn(sample);

    ApiResponse<AppointmentResponse> res = controller.getUpcomingAppointment(patientPrincipal);

    assertThat(res.success()).isTrue();
    assertThat(res.data()).isEqualTo(sample);
    verify(appointmentService).getUpcomingAppointment(patientId);
  }
}
