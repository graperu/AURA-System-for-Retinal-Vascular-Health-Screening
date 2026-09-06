package com.aura.notification.service;

import com.aura.notification.dto.NotificationPreferenceResponse;
import com.aura.notification.dto.NotificationResponse;
import com.aura.notification.dto.UpdateNotificationPreferenceRequest;
import com.aura.notification.entity.AppNotification;
import com.aura.notification.entity.NotificationPreference;
import com.aura.notification.entity.NotificationType;
import com.aura.notification.repository.NotificationPreferenceRepository;
import com.aura.notification.repository.NotificationRepository;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  private final NotificationRepository notificationRepository;
  private final NotificationPreferenceRepository preferenceRepository;
  private final NotificationSseHub sseHub;

  public NotificationService(
      NotificationRepository notificationRepository,
      NotificationPreferenceRepository preferenceRepository,
      NotificationSseHub sseHub) {
    this.notificationRepository = notificationRepository;
    this.preferenceRepository = preferenceRepository;
    this.sseHub = sseHub;
  }

  public List<NotificationResponse> list(UUID userId) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(NotificationResponse::from)
        .toList();
  }

  public long unreadCount(UUID userId) {
    return notificationRepository.countByUserIdAndReadFalse(userId);
  }

  @Transactional
  public void markAllRead(UUID userId) {
    notificationRepository
        .findByUserIdOrderByCreatedAtDesc(userId)
        .forEach(AppNotification::markRead);
  }

  @Transactional
  public void markRead(UUID userId, UUID notificationId) {
    notificationRepository
        .findById(notificationId)
        .filter(n -> n.getUserId().equals(userId))
        .ifPresent(AppNotification::markRead);
  }

  public NotificationPreferenceResponse getPreferences(UUID userId) {
    NotificationPreference p = preference(userId);
    return toDto(p);
  }

  @Transactional
  public NotificationPreferenceResponse updatePreferences(
      UUID userId, UpdateNotificationPreferenceRequest req) {
    NotificationPreference p = preference(userId);
    if (req.webPush() != null) p.setWebPush(req.webPush());
    if (req.emailEnabled() != null) p.setEmailEnabled(req.emailEnabled());
    if (req.smsEnabled() != null) p.setSmsEnabled(req.smsEnabled());
    if (req.aiReady() != null) p.setAiReady(req.aiReady());
    if (req.doctorMessage() != null) p.setDoctorMessage(req.doctorMessage());
    if (req.appointmentReminder() != null) p.setAppointmentReminder(req.appointmentReminder());
    if (req.lowCredit() != null) p.setLowCredit(req.lowCredit());
    return toDto(preferenceRepository.save(p));
  }

  public void notifyAiReady(UUID patientId, Screening screening) {
    boolean critical = screening.getRiskLevel() == RiskLevel.CRITICAL;
    String title = critical ? "Kết quả AI: ca nguy kịch" : "Kết quả AI đã sẵn sàng";
    String body =
        "Ảnh võng mạc đã phân tích xong. Mức nguy cơ: "
            + (screening.getRiskLevel() != null ? screening.getRiskLevel() : "N/A")
            + ". AVR="
            + screening.getAvRatio()
            + ".";
    dispatch(
        patientId,
        NotificationType.AI_READY,
        title,
        body,
        critical,
        screening.getId() != null ? screening.getId().toString() : null);
    if (critical) {
      dispatch(
          patientId,
          NotificationType.CRITICAL_ALERT,
          "SMS cảnh báo ca nguy kịch",
          "Hệ thống đã gửi SMS khẩn vì AI phát hiện nguy cơ CRITICAL. Liên hệ bác sĩ trong 24-48 giờ.",
          true,
          screening.getId() != null ? screening.getId().toString() : null);
    }
  }

  public void notifyDoctorMessage(UUID receiverId, String preview) {
    dispatch(
        receiverId,
        NotificationType.DOCTOR_MESSAGE,
        "Tin nhắn mới từ bác sĩ",
        preview == null || preview.isBlank() ? "Bạn có phản hồi mới từ bác sĩ phụ trách." : preview,
        false,
        null);
  }

  public void notifyLowCredit(UUID userId, int remaining) {
    dispatch(
        userId,
        NotificationType.LOW_CREDIT,
        "Số lượt phân tích sắp hết",
        "Tài khoản còn " + remaining + " lượt. Hãy gia hạn gói để không gián đoạn tầm soát.",
        false,
        null);
  }

  @Transactional
  public NotificationResponse createAppointmentReminder(UUID userId) {
    return dispatch(
        userId,
        NotificationType.APPOINTMENT_REMINDER,
        "Nhắc lịch tái khám định kỳ",
        "Đã đến kỳ tầm soát võng mạc. Đặt lịch tái khám để bác sĩ theo dõi xu hướng vi mạch.",
        false,
        null);
  }

  private NotificationResponse dispatch(
      UUID userId,
      NotificationType type,
      String title,
      String body,
      boolean critical,
      String relatedId) {
    NotificationPreference prefs = preference(userId);
    if (!isTypeEnabled(prefs, type) && !critical) {
      return null;
    }
    List<String> channels = new ArrayList<>();
    if (prefs.isWebPush() || type == NotificationType.AI_READY) {
      channels.add("WEB");
      channels.add("PUSH");
    }
    if (prefs.isEmailEnabled()) {
      channels.add("EMAIL");
      log.info("[EMAIL mock] to user {} | {} | {}", userId, title, body);
    }
    if (critical || (prefs.isSmsEnabled() && type == NotificationType.CRITICAL_ALERT)) {
      channels.add("SMS");
      log.info("[SMS mock] CRITICAL to user {} | {}", userId, body);
    }
    if (channels.isEmpty()) {
      channels.add("WEB");
    }
    AppNotification saved =
        notificationRepository.save(
            new AppNotification(
                userId, type, title, body, String.join(",", channels), critical, relatedId));
    NotificationResponse dto = NotificationResponse.from(saved);
    sseHub.publish(userId, dto);
    return dto;
  }

  private boolean isTypeEnabled(NotificationPreference prefs, NotificationType type) {
    return switch (type) {
      case AI_READY -> prefs.isAiReady();
      case DOCTOR_MESSAGE -> prefs.isDoctorMessage();
      case APPOINTMENT_REMINDER -> prefs.isAppointmentReminder();
      case LOW_CREDIT -> prefs.isLowCredit();
      case CRITICAL_ALERT -> true;
    };
  }

  private NotificationPreference preference(UUID userId) {
    return preferenceRepository
        .findById(userId)
        .orElseGet(() -> preferenceRepository.save(new NotificationPreference(userId)));
  }

  private NotificationPreferenceResponse toDto(NotificationPreference p) {
    return new NotificationPreferenceResponse(
        p.isWebPush(),
        p.isEmailEnabled(),
        p.isSmsEnabled(),
        p.isAiReady(),
        p.isDoctorMessage(),
        p.isAppointmentReminder(),
        p.isLowCredit());
  }
}
