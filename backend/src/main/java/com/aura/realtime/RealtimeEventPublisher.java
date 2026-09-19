package com.aura.realtime;

import com.aura.screening.entity.ReviewDecision;
import com.aura.screening.entity.Screening;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RealtimeEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(RealtimeEventPublisher.class);

  private final SimpMessagingTemplate messagingTemplate;

  @Autowired
  public RealtimeEventPublisher(@Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public SimpMessagingTemplate getMessagingTemplate() {
    return messagingTemplate;
  }

  /**
   * Generic publish method wrapping data into RealtimeEventEnvelope and sending via STOMP.
   */
  public void publish(String topic, String eventType, Object data) {
    if (messagingTemplate == null) {
      log.debug("SimpMessagingTemplate is null; skipping STOMP publish {} to {}", eventType, topic);
      return;
    }
    try {
      RealtimeEventEnvelope<Object> envelope = RealtimeEventEnvelope.of(eventType, data);
      messagingTemplate.convertAndSend(topic, envelope);
      log.debug("STOMP event [{}] successfully published to {}", eventType, topic);
    } catch (Exception e) {
      log.warn("Failed to publish STOMP event [{}] to {}: {}", eventType, topic, e.getMessage());
    }
  }

  public void publishScreeningCreated(Screening screening) {
    if (screening == null || screening.getPatientId() == null) {
      return;
    }
    Map<String, Object> data = new HashMap<>();
    data.put("screeningId", screening.getId());
    data.put("patientId", screening.getPatientId());
    data.put("clinicId", screening.getClinicId());
    data.put("doctorId", screening.getDoctorId());
    data.put("eyePosition", screening.getEyePosition());
    data.put("scanType", screening.getScanType());
    data.put("imageUrl", screening.getImageUrl());
    data.put("status", screening.getStatus() != null ? screening.getStatus().name() : "QUEUED");
    data.put("createdAt", screening.getCreatedAt() != null ? screening.getCreatedAt().toString() : Instant.now().toString());

    publish("/topic/screening." + screening.getPatientId(), "SCREENING_CREATED", data);

    if (screening.getClinicId() != null) {
      publish("/topic/clinic." + screening.getClinicId(), "SCREENING_CREATED", data);
    }
    if (screening.getDoctorId() != null) {
      publish("/topic/notifications." + screening.getDoctorId(), "SCREENING_CREATED", data);
    }
  }

  public void publishScreeningProcessing(
      UUID patientId,
      UUID screeningId,
      String step,
      int stepIndex,
      int totalSteps,
      String stepTitle,
      String statusMessage
  ) {
    if (patientId == null) {
      return;
    }
    ScreeningProcessingData data = ScreeningProcessingData.of(
        screeningId,
        patientId,
        step,
        stepIndex,
        totalSteps,
        stepTitle,
        statusMessage
    );
    publish("/topic/screening." + patientId, "SCREENING_PROCESSING", data);
  }

  public void publishScreeningCompleted(Screening screening) {
    publishScreeningCompleted(screening, null, 0);
  }

  public void publishScreeningCompleted(Screening screening, Map<String, Object> biomarkers, int detectedAnomaliesCount) {
    if (screening == null || screening.getPatientId() == null) {
      return;
    }
    ScreeningCompletedData data = new ScreeningCompletedData(
        screening.getId(),
        screening.getPatientId(),
        screening.getClinicId(),
        screening.getDoctorId(),
        screening.getRiskScore(),
        screening.getRiskLevel() != null ? screening.getRiskLevel().name() : null,
        screening.getConfidence(),
        screening.getCardiovascularRiskScore(),
        screening.getCardiovascularRiskLevel(),
        screening.getDiabeticRetinopathyRiskScore(),
        screening.getDiabeticRetinopathyRiskLevel(),
        screening.getStrokeRiskScore(),
        screening.getStrokeRiskLevel(),
        screening.getHypertensionRiskScore(),
        screening.getHypertensionRiskLevel(),
        screening.getEtdrsGrade(),
        biomarkers != null ? biomarkers : Map.of(),
        detectedAnomaliesCount,
        screening.getFindings(),
        screening.getRecommendations(),
        screening.getStatus() != null ? screening.getStatus().name() : "ANALYZED",
        Instant.now()
    );

    publish("/topic/screening." + screening.getPatientId(), "SCREENING_COMPLETED", data);
    publish("/topic/notifications." + screening.getPatientId(), "SCREENING_COMPLETED", data);

    if (screening.getClinicId() != null) {
      publish("/topic/clinic." + screening.getClinicId(), "SCREENING_COMPLETED", data);
    }
    if (screening.getDoctorId() != null) {
      publish("/topic/notifications." + screening.getDoctorId(), "SCREENING_COMPLETED", data);
    }
  }

  public void publishScreeningFailed(UUID patientId, UUID screeningId, String errorCode, String errorMessage) {
    if (patientId == null) {
      return;
    }
    ScreeningFailedData data = ScreeningFailedData.of(screeningId, patientId, errorCode, errorMessage);
    publish("/topic/screening." + patientId, "SCREENING_FAILED", data);
    publish("/topic/notifications." + patientId, "SCREENING_FAILED", data);
  }

  public void publishDoctorReviewed(
      Screening screening,
      String doctorName,
      ReviewDecision decision,
      String doctorNotes,
      List<String> icd10Codes
  ) {
    if (screening == null || screening.getPatientId() == null) {
      return;
    }
    DoctorReviewedData data = new DoctorReviewedData(
        screening.getId(),
        screening.getPatientId(),
        screening.getDoctorId(),
        doctorName != null ? doctorName : "Bác sĩ chuyên khoa",
        decision != null ? decision.name() : "AGREED",
        doctorNotes,
        screening.getRiskLevel() != null ? screening.getRiskLevel().name() : null,
        icd10Codes,
        screening.getDigitalSignature(),
        screening.getSignedAt() != null ? screening.getSignedAt() : Instant.now(),
        screening.getStatus() != null ? screening.getStatus().name() : "REVIEWED"
    );

    publish("/topic/screening." + screening.getPatientId(), "DOCTOR_REVIEWED", data);
    publish("/topic/notifications." + screening.getPatientId(), "DOCTOR_REVIEWED", data);

    if (screening.getClinicId() != null) {
      publish("/topic/clinic." + screening.getClinicId(), "DOCTOR_REVIEWED", data);
    }
  }

  public void publishDoctorOverride(
      Screening screening,
      String originalAiRiskLevel,
      String adjustedDoctorRiskLevel,
      String overrideReason
  ) {
    if (screening == null || screening.getPatientId() == null) {
      return;
    }
    DoctorOverrideData data = new DoctorOverrideData(
        screening.getId(),
        screening.getPatientId(),
        screening.getDoctorId(),
        originalAiRiskLevel,
        adjustedDoctorRiskLevel,
        overrideReason,
        screening.getDigitalSignature(),
        screening.getSignedAt() != null ? screening.getSignedAt() : Instant.now()
    );

    publish("/topic/screening." + screening.getPatientId(), "DOCTOR_OVERRIDE", data);
    publish("/topic/notifications." + screening.getPatientId(), "DOCTOR_OVERRIDE", data);

    if (screening.getClinicId() != null) {
      publish("/topic/clinic." + screening.getClinicId(), "DOCTOR_OVERRIDE", data);
    }
  }

  public void publishNotification(UUID userId, Object notificationDto) {
    if (userId == null) {
      return;
    }
    publish("/topic/notifications." + userId, "NOTIFICATION_CREATED", notificationDto);
  }

  public void publishAppointment(UUID userId, String eventType, Object data) {
    if (userId == null) {
      return;
    }
    publish("/topic/appointments." + userId, eventType, data);
  }

  public void publishBatchProgress(UUID clinicId, Object data) {
    if (clinicId == null) {
      return;
    }
    publish("/topic/clinic." + clinicId, "BATCH_PROGRESS", data);
  }
}
