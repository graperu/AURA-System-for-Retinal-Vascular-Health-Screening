package com.aura.appointment.dto;

import com.aura.appointment.entity.Appointment;
import com.aura.appointment.entity.AppointmentStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AppointmentResponse(
    UUID id,
    UUID patientId,
    String patientName,
    String patientEmail,
    String patientMrn,
    UUID doctorId,
    String doctorName,
    LocalDate appointmentDate,
    String timeSlot,
    String reason,
    String notes,
    AppointmentStatus status,
    Instant createdAt,
    Instant updatedAt
) {
  public static AppointmentResponse fromEntity(Appointment appointment) {
    return fromEntity(appointment, null);
  }

  public static AppointmentResponse fromEntity(Appointment appointment, String patientMrn) {
    if (appointment == null) {
      return null;
    }
    UUID patientId = appointment.getPatient() != null ? appointment.getPatient().getId() : null;
    String patientName = appointment.getPatient() != null ? appointment.getPatient().getFullName() : null;
    String patientEmail = appointment.getPatient() != null ? appointment.getPatient().getEmail() : null;
    UUID doctorId = appointment.getDoctor() != null ? appointment.getDoctor().getId() : null;
    String doctorName = appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : null;

    return new AppointmentResponse(
        appointment.getId(),
        patientId,
        patientName,
        patientEmail,
        patientMrn,
        doctorId,
        doctorName,
        appointment.getAppointmentDate(),
        appointment.getTimeSlot(),
        appointment.getReason(),
        appointment.getNotes(),
        appointment.getStatus(),
        appointment.getCreatedAt(),
        appointment.getUpdatedAt()
    );
  }
}
