package com.aura.appointment.controller;

import com.aura.appointment.dto.AppointmentResponse;
import com.aura.appointment.dto.CreateAppointmentRequest;
import com.aura.appointment.dto.UpdateAppointmentStatusRequest;
import com.aura.appointment.service.AppointmentService;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/appointments")
@PreAuthorize("isAuthenticated()")
public class AppointmentController {

  private final AppointmentService appointmentService;

  public AppointmentController(AppointmentService appointmentService) {
    this.appointmentService = appointmentService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<AppointmentResponse> createAppointment(
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody CreateAppointmentRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để đặt lịch hẹn");
    }
    AppointmentResponse response = appointmentService.createAppointment(principal.id(), request);
    return ApiResponse.success("Đặt lịch hẹn khám thành công", response);
  }

  @GetMapping
  public ApiResponse<List<AppointmentResponse>> getAppointments(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để xem danh sách lịch hẹn");
    }

    boolean isAdmin = hasRole(principal, "ADMIN");
    boolean isDoctor = hasRole(principal, "DOCTOR");
    boolean isClinic = hasRole(principal, "CLINIC");

    List<AppointmentResponse> appointments;
    if (isAdmin || isClinic) {
      appointments = appointmentService.getAllAppointments();
    } else if (isDoctor) {
      appointments = appointmentService.getAppointmentsForDoctor(principal.id());
    } else {
      appointments = appointmentService.getAppointmentsForPatient(principal.id());
    }

    return ApiResponse.success("Lấy danh sách lịch hẹn thành công", appointments);
  }

  @GetMapping("/upcoming")
  public ApiResponse<AppointmentResponse> getUpcomingAppointment(
      @AuthenticationPrincipal AuraUserPrincipal principal) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để xem lịch hẹn");
    }
    AppointmentResponse response = appointmentService.getUpcomingAppointment(principal.id());
    return ApiResponse.success("Lấy thông tin lịch hẹn sắp tới thành công", response);
  }

  @GetMapping("/doctor/{doctorId}/slots")
  public ApiResponse<List<String>> getBookedSlots(
      @PathVariable UUID doctorId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    List<String> bookedSlots = appointmentService.getBookedSlotsForDoctor(doctorId, date);
    return ApiResponse.success("Lấy danh sách khung giờ đã đặt thành công", bookedSlots);
  }

  @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
  public ApiResponse<AppointmentResponse> updateStatus(
      @PathVariable UUID id,
      @AuthenticationPrincipal AuraUserPrincipal principal,
      @Valid @RequestBody UpdateAppointmentStatusRequest request) {
    if (principal == null) {
      throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập để cập nhật lịch hẹn");
    }
    AppointmentResponse response = appointmentService.updateStatus(id, principal.id(), principal.roles(), request);
    return ApiResponse.success("Cập nhật trạng thái lịch hẹn thành công", response);
  }

  private boolean hasRole(AuraUserPrincipal principal, String role) {
    if (principal == null || principal.roles() == null) {
      return false;
    }
    return principal.roles().stream()
        .anyMatch(r -> r.equalsIgnoreCase(role) || r.equalsIgnoreCase("ROLE_" + role));
  }
}
