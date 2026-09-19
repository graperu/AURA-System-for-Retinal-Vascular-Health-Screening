package com.aura.appointment.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record CreateAppointmentRequest(
    @NotNull(message = "doctorId không được để trống")
    UUID doctorId,

    @NotNull(message = "appointmentDate không được để trống")
    LocalDate appointmentDate,

    @NotNull(message = "timeSlot không được để trống")
    String timeSlot,

    String reason,
    String notes
) {}
