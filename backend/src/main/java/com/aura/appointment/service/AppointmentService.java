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
  private final com.aura.notification.service.UserNotificationService userNotificationService;

  @Autowired
  public AppointmentService(
      AppointmentRepository appointmentRepository,
      UserRepository userRepository,
      @Autowired(required = false) PatientProfileRepository patientProfileRepository,
      @Autowired(required = false) RealtimeEventPublisher realtimeEventPublisher,
      @Autowired(required = false) com.aura.notification.service.UserNotificationService userNotificationService) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.patientProfileRepository = patientProfileRepository;
    this.realtimeEventPublisher = realtimeEventPublisher;
    this.userNotificationService = userNotificationService;
  }

  public AppointmentService(
      AppointmentRepository appointmentRepository,
      UserRepository userRepository,
      PatientProfileRepository patientProfileRepository,
      RealtimeEventPublisher realtimeEventPublisher) {
    this(appointmentRepository, userRepository, patientProfileRepository, realtimeEventPublisher, null);
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

    // Send in-app user notifications
    if (userNotificationService != null) {
      try {
        String patientDisplayName = patient.getFullName() != null && !patient.getFullName().isBlank() ? patient.getFullName() : "Bệnh nhân";
        String doctorDisplayName = doctor.getFullName() != null && !doctor.getFullName().isBlank() ? doctor.getFullName() : "Bác sĩ chuyên khoa";

        // Notify Doctor
        userNotificationService.sendNotificationToUser(
            doctor.getId(),
            "Yêu cầu lịch hẹn mới",
            "Bệnh nhân " + patientDisplayName + " đã đặt lịch hẹn khám vào ngày " + req.appointmentDate() + " (" + req.timeSlot() + ").",
            "APPOINTMENT",
            "INFO",
            "/doctor/appointments"
        );

        // Notify Patient
        userNotificationService.sendNotificationToUser(
            patient.getId(),
            "Đã gửi yêu cầu đặt lịch hẹn",
            "Yêu cầu đặt lịch hẹn với " + doctorDisplayName + " vào ngày " + req.appointmentDate() + " (" + req.timeSlot() + ") đang chờ xác nhận.",
            "APPOINTMENT",
            "INFO",
            "/patient/appointment"
        );
      } catch (Exception e) {
        log.warn("[AppointmentService] Failed to send creation notification: {}", e.getMessage());
      }
    }

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
    boolean isClinic = actorRoles != null && actorRoles.stream().anyMatch(r -> r.toUpperCase().contains("CLINIC"));
    boolean isAssignedDoctor = appointment.getDoctor() != null && appointment.getDoctor().getId().equals(actorId);
    boolean isOwnerPatient = appointment.getPatient() != null && appointment.getPatient().getId().equals(actorId);

    if (!isAdmin && !isClinic && !isAssignedDoctor && !isOwnerPatient) {
      throw new AccessDeniedException("Bạn không có quyền cập nhật lịch hẹn này");
    }

    if (isOwnerPatient && !isAssignedDoctor && !isAdmin && !isClinic) {
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

    // Send in-app user notifications based on new status
    if (userNotificationService != null) {
      try {
        String docName = updated.getDoctor() != null && updated.getDoctor().getFullName() != null && !updated.getDoctor().getFullName().isBlank()
            ? updated.getDoctor().getFullName()
            : "Bác sĩ chuyên khoa";
        String patName = updated.getPatient() != null && updated.getPatient().getFullName() != null && !updated.getPatient().getFullName().isBlank()
            ? updated.getPatient().getFullName()
            : "Bệnh nhân";

        if (req.status() == AppointmentStatus.CONFIRMED) {
          userNotificationService.sendNotificationToUser(
              updated.getPatient().getId(),
              "Lịch hẹn khám đã được xác nhận",
              "Phòng khám & Bác sĩ " + docName + " đã xác nhận lịch hẹn của bạn vào ngày " + updated.getAppointmentDate() + " (" + updated.getTimeSlot() + "). Vui lòng đến đúng giờ.",
              "APPOINTMENT",
              "SUCCESS",
              "/patient/appointment"
          );
          userNotificationService.sendNotificationToUser(
              updated.getDoctor().getId(),
              "Lịch hẹn khám đã được xác nhận",
              "Lịch hẹn với bệnh nhân " + patName + " vào ngày " + updated.getAppointmentDate() + " (" + updated.getTimeSlot() + ") đã được xác nhận.",
              "APPOINTMENT",
              "SUCCESS",
              "/doctor/appointments"
          );
        } else if (req.status() == AppointmentStatus.CANCELLED) {
          String reasonNote = req.notes() != null && !req.notes().isBlank() ? " (" + req.notes().trim() + ")" : "";
          userNotificationService.sendNotificationToUser(
              updated.getPatient().getId(),
              "Lịch hẹn khám đã bị hủy / từ chối",
              "Lịch hẹn với Bác sĩ " + docName + " vào ngày " + updated.getAppointmentDate() + " đã bị hủy." + reasonNote,
              "APPOINTMENT",
              "WARNING",
              "/patient/appointment"
          );
          userNotificationService.sendNotificationToUser(
              updated.getDoctor().getId(),
              "Lịch hẹn khám đã bị hủy",
              "Lịch hẹn với bệnh nhân " + patName + " vào ngày " + updated.getAppointmentDate() + " (" + updated.getTimeSlot() + ") đã bị hủy." + reasonNote,
              "APPOINTMENT",
              "WARNING",
              "/doctor/appointments"
          );
        } else if (req.status() == AppointmentStatus.COMPLETED) {
          userNotificationService.sendNotificationToUser(
              updated.getPatient().getId(),
              "Hoàn tất ca khám",
              "Ca khám sàng lọc võng mạc với " + docName + " đã hoàn tất thành công. Kết quả chẩn đoán đã được cập nhật vào hồ sơ bệnh án.",
              "APPOINTMENT",
              "SUCCESS",
              "/patient/scan-history"
          );
        }
      } catch (Exception e) {
        log.warn("[AppointmentService] Failed to send status update notification: {}", e.getMessage());
      }
    }

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
