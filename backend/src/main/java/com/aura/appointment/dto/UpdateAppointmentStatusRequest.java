package com.aura.appointment.dto;

import com.aura.appointment.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record UpdateAppointmentStatusRequest(
    @NotNull(message = "status không được để trống")
    AppointmentStatus status,

    String notes,
    LocalDate rescheduledDate,
    String rescheduledTimeSlot
) {}
