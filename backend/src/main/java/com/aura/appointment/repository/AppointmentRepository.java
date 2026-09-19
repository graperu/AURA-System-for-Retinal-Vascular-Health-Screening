package com.aura.appointment.repository;

import com.aura.appointment.entity.Appointment;
import com.aura.appointment.entity.AppointmentStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

  List<Appointment> findByPatientIdOrderByAppointmentDateDescTimeSlotDesc(UUID patientId);

  List<Appointment> findByDoctorIdOrderByAppointmentDateDescTimeSlotDesc(UUID doctorId);

  List<Appointment> findByDoctorIdAndAppointmentDateOrderByTimeSlotAsc(UUID doctorId, LocalDate appointmentDate);

  boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
      UUID doctorId, LocalDate appointmentDate, String timeSlot, AppointmentStatus status);

  List<Appointment> findAllByOrderByAppointmentDateDescTimeSlotDesc();
}
