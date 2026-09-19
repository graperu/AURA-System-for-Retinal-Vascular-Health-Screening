package com.aura.appointment.service;

import com.aura.appointment.dto.AppointmentResponse;
import com.aura.appointment.dto.CreateAppointmentRequest;
import com.aura.appointment.dto.UpdateAppointmentStatusRequest;
import com.aura.appointment.entity.Appointment;
import com.aura.appointment.entity.AppointmentStatus;
import com.aura.appointment.repository.AppointmentRepository;
import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.realtime.RealtimeEventPublisher;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

  private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

  private final AppointmentRepository appointmentRepository;
  private final UserRepository userRepository;
  private final PatientProfileRepository patientProfileRepository;
  private final RealtimeEventPublisher realtimeEventPublisher;

  @Autowired
  public AppointmentService(
      AppointmentRepository appointmentRepository,
      UserRepository userRepository,
      @Autowired(required = false) PatientProfileRepository patientProfileRepository,
      @Autowired(required = false) RealtimeEventPublisher realtimeEventPublisher) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.patientProfileRepository = patientProfileRepository;
    this.realtimeEventPublisher = realtimeEventPublisher;
  }

  @Transactional
  public AppointmentResponse createAppointment(UUID patientId, CreateAppointmentRequest req) {
    if (patientId == null) {
      throw new IllegalArgumentException("patientId không được để trống");
    }
    User patient = userRepository.findById(patientId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId));

    User doctor = userRepository.findById(req.doctorId())
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + req.doctorId()));

    if (req.appointmentDate().isBefore(LocalDate.now())) {
      throw new IllegalArgumentException("Không thể đặt lịch hẹn trong quá khứ");
    }

    boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
        req.doctorId(), req.appointmentDate(), req.timeSlot(), AppointmentStatus.CANCELLED);
    if (slotTaken) {
      throw new IllegalStateException("Khung giờ " + req.timeSlot() + " ngày " + req.appointmentDate() + " đã có người đặt trước. Vui lòng chọn khung giờ khác.");
    }

    Appointment appointment = new Appointment(
        patient,
        doctor,
        req.appointmentDate(),
        req.timeSlot(),
        req.reason(),
        req.notes()
    );
    appointment.setStatus(AppointmentStatus.PENDING);
    Appointment saved = appointmentRepository.save(appointment);

    String mrn = resolvePatientMrn(patientId);
    AppointmentResponse response = AppointmentResponse.fromEntity(saved, mrn);

    // Realtime STOMP notification dispatch
    if (realtimeEventPublisher != null) {
      realtimeEventPublisher.publishAppointment(doctor.getId(), "APPOINTMENT_CREATED", response);
      realtimeEventPublisher.publishAppointment(patient.getId(), "APPOINTMENT_CREATED", response);
      log.info("[AppointmentService] Published APPOINTMENT_CREATED to doctor {} and patient {}", doctor.getId(), patient.getId());
    }

    return response;
  }

  @Transactional(readOnly = true)
  public List<AppointmentResponse> getAppointmentsForPatient(UUID patientId) {
    List<Appointment> list = appointmentRepository.findByPatientIdOrderByAppointmentDateDescTimeSlotDesc(patientId);
    String mrn = resolvePatientMrn(patientId);
    return list.stream().map(a -> AppointmentResponse.fromEntity(a, mrn)).toList();
  }

  @Transactional(readOnly = true)
  public List<AppointmentResponse> getAppointmentsForDoctor(UUID doctorId) {
    List<Appointment> list = appointmentRepository.findByDoctorIdOrderByAppointmentDateDescTimeSlotDesc(doctorId);
    return list.stream().map(a -> {
      String mrn = resolvePatientMrn(a.getPatient() != null ? a.getPatient().getId() : null);
      return AppointmentResponse.fromEntity(a, mrn);
    }).toList();
  }

  @Transactional(readOnly = true)
  public List<AppointmentResponse> getAllAppointments() {
    List<Appointment> list = appointmentRepository.findAllByOrderByAppointmentDateDescTimeSlotDesc();
    return list.stream().map(a -> {
      String mrn = resolvePatientMrn(a.getPatient() != null ? a.getPatient().getId() : null);
      return AppointmentResponse.fromEntity(a, mrn);
    }).toList();
  }

  @Transactional(readOnly = true)
  public AppointmentResponse getUpcomingAppointment(UUID userId) {
    if (userId == null) {
      return null;
    }
    LocalDate today = LocalDate.now();
    List<Appointment> list = appointmentRepository.findByPatientIdOrderByAppointmentDateDescTimeSlotDesc(userId);
    if (list.isEmpty()) {
      list = appointmentRepository.findByDoctorIdOrderByAppointmentDateDescTimeSlotDesc(userId);
    }
    return list.stream()
        .filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(today))
        .filter(a -> a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
        .min((a, b) -> {
          int c = a.getAppointmentDate().compareTo(b.getAppointmentDate());
          return c != 0 ? c : (a.getTimeSlot() != null && b.getTimeSlot() != null ? a.getTimeSlot().compareTo(b.getTimeSlot()) : 0);
        })
        .map(a -> {
          String mrn = resolvePatientMrn(a.getPatient() != null ? a.getPatient().getId() : null);
          return AppointmentResponse.fromEntity(a, mrn);
        })
        .orElse(null);
  }

  @Transactional(readOnly = true)
  public List<String> getBookedSlotsForDoctor(UUID doctorId, LocalDate date) {
    List<Appointment> list = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByTimeSlotAsc(doctorId, date);
    return list.stream()
        .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
        .map(Appointment::getTimeSlot)
        .toList();
  }

  @Transactional
  public AppointmentResponse updateStatus(UUID appointmentId, UUID actorId, List<String> actorRoles, UpdateAppointmentStatusRequest req) {
    Appointment appointment = appointmentRepository.findById(appointmentId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn với ID: " + appointmentId));

    boolean isAdmin = actorRoles != null && actorRoles.stream().anyMatch(r -> r.toUpperCase().contains("ADMIN"));
    boolean isAssignedDoctor = appointment.getDoctor() != null && appointment.getDoctor().getId().equals(actorId);
    boolean isOwnerPatient = appointment.getPatient() != null && appointment.getPatient().getId().equals(actorId);

    if (!isAdmin && !isAssignedDoctor && !isOwnerPatient) {
      throw new AccessDeniedException("Bạn không có quyền cập nhật lịch hẹn này");
    }

    if (isOwnerPatient && !isAssignedDoctor && !isAdmin) {
      if (req.status() != AppointmentStatus.CANCELLED) {
        throw new AccessDeniedException("Bệnh nhân chỉ có thể yêu cầu hủy lịch hẹn");
      }
    }

    if (req.rescheduledDate() != null && req.rescheduledTimeSlot() != null) {
      if (req.rescheduledDate().isBefore(LocalDate.now())) {
        throw new IllegalArgumentException("Không thể dời lịch hẹn về quá khứ");
      }
      boolean slotTaken = appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
          appointment.getDoctor().getId(), req.rescheduledDate(), req.rescheduledTimeSlot(), AppointmentStatus.CANCELLED);
      if (slotTaken) {
        throw new IllegalStateException("Khung giờ mới đã có người đặt. Vui lòng chọn khung giờ khác.");
      }
      appointment.setAppointmentDate(req.rescheduledDate());
      appointment.setTimeSlot(req.rescheduledTimeSlot());
    }

    appointment.setStatus(req.status());
    if (req.notes() != null && !req.notes().isBlank()) {
      if (appointment.getNotes() != null && !appointment.getNotes().isBlank()) {
        appointment.setNotes(appointment.getNotes() + "\n" + req.notes());
      } else {
        appointment.setNotes(req.notes());
      }
    }

    Appointment updated = appointmentRepository.save(appointment);
    String mrn = resolvePatientMrn(updated.getPatient() != null ? updated.getPatient().getId() : null);
    AppointmentResponse response = AppointmentResponse.fromEntity(updated, mrn);

    if (realtimeEventPublisher != null) {
      if (updated.getDoctor() != null) {
        realtimeEventPublisher.publishAppointment(updated.getDoctor().getId(), "APPOINTMENT_UPDATED", response);
      }
      if (updated.getPatient() != null) {
        realtimeEventPublisher.publishAppointment(updated.getPatient().getId(), "APPOINTMENT_UPDATED", response);
      }
      log.info("[AppointmentService] Published APPOINTMENT_UPDATED for appointment {}", updated.getId());
    }

    return response;
  }

  private String resolvePatientMrn(UUID patientId) {
    if (patientId == null || patientProfileRepository == null) {
      return null;
    }
    try {
      return patientProfileRepository.findByUserId(patientId)
          .map(com.aura.patient.entity.PatientProfile::getMrn)
          .orElse(null);
    } catch (Exception e) {
      return null;
    }
  }
}
