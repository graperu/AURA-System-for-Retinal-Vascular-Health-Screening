package com.aura.service;

import com.aura.controller.RealtimeSseController;
import com.aura.event.BatchJobEvent;
import com.aura.event.ClinicalReviewEvent;
import com.aura.event.CrossPortalEvent;
import com.aura.event.ScanUploadedEvent;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Service for publishing real-time events across portals (Doctor, Patient, Clinic, Admin)
 * via STOMP WebSockets and SSE streams.
 */
@Service("realTimeEventPublisher")
public class RealTimeEventPublisher {

  private static final Logger log = LoggerFactory.getLogger(RealTimeEventPublisher.class);

  private final SimpMessagingTemplate messagingTemplate;
  private final ApplicationEventPublisher applicationEventPublisher;
  private RealtimeSseController sseController;

  @Autowired
  public RealTimeEventPublisher(
      @Autowired(required = false) SimpMessagingTemplate messagingTemplate,
      ApplicationEventPublisher applicationEventPublisher,
      @Autowired(required = false) @Lazy RealtimeSseController sseController) {
    this.messagingTemplate = messagingTemplate;
    this.applicationEventPublisher = applicationEventPublisher;
    this.sseController = sseController;
  }

  public void setSseController(RealtimeSseController sseController) {
    this.sseController = sseController;
  }

  public SimpMessagingTemplate getMessagingTemplate() {
    return messagingTemplate;
  }

  /**
   * Publishes a cross-portal domain event to designated WebSocket topics and active SSE streams.
   *
   * @param event the CrossPortalEvent domain event
   */
  public void publish(CrossPortalEvent event) {
    if (event == null) {
      log.warn("Attempted to publish null CrossPortalEvent");
      return;
    }

    log.info("Publishing CrossPortalEvent: id={}, type={}, source={}, role={}",
        event.getEventId(), event.getEventType(), event.getPortalSource(), event.getTargetRole());

    // 1. Aggregated stream topic for system-wide sync
    sendToDestination("/topic/portal-sync", event);

    // 2. Doctor scans channel
    if (event instanceof ScanUploadedEvent
        || "DOCTOR".equalsIgnoreCase(event.getTargetRole())
        || event instanceof ClinicalReviewEvent) {
      sendToDestination("/topic/doctor/scans", event);
    }

    // 3. Patient personal channel
    UUID targetPatientId = extractPatientId(event);
    if (targetPatientId != null) {
      sendToDestination("/topic/patient/" + targetPatientId, event);
    }

    // 4. Admin activity feed
    sendToDestination("/topic/admin/activity", event);

    // 5. Clinic-specific topic if applicable
    if (event instanceof BatchJobEvent batchJobEvent && batchJobEvent.getClinicId() != null) {
      sendToDestination("/topic/clinic/" + batchJobEvent.getClinicId(), event);
    }

    // 6. Broadcast to SSE active connections
    if (sseController != null) {
      try {
        sseController.broadcast(event);
      } catch (Exception e) {
        log.warn("Error broadcasting event {} to SSE: {}", event.getEventId(), e.getMessage());
      }
    }

    // 7. Internal Spring ApplicationEvent publication
    if (applicationEventPublisher != null) {
      try {
        applicationEventPublisher.publishEvent(event);
      } catch (Exception e) {
        log.warn("Error publishing internal application event {}: {}", event.getEventId(), e.getMessage());
      }
    }
  }

  /**
   * Helper method to publish a ScanUploadedEvent.
   */
  public void publishScanUploaded(UUID scanId, UUID patientId, String patientName, String eye, Double riskScore) {
    ScanUploadedEvent event = new ScanUploadedEvent(scanId, patientId, patientName, eye, riskScore);
    publish(event);
  }

  /**
   * Helper method to publish a ClinicalReviewEvent.
   */
  public void publishClinicalReview(UUID reviewId, UUID scanId, UUID patientId, String doctorName, String status, String notes) {
    ClinicalReviewEvent event = new ClinicalReviewEvent(reviewId, scanId, patientId, doctorName, status, notes);
    publish(event);
  }

  /**
   * Helper method to publish a BatchJobEvent.
   */
  public void publishBatchJob(UUID batchId, UUID clinicId, Integer totalScans, String status) {
    BatchJobEvent event = new BatchJobEvent(batchId, clinicId, totalScans, status);
    publish(event);
  }

  /**
   * Dispatches a message to a specific STOMP destination.
   */
  public void sendToDestination(String destination, Object payload) {
    if (messagingTemplate == null) {
      log.debug("SimpMessagingTemplate unavailable; skipping send to {}", destination);
      return;
    }
    try {
      messagingTemplate.convertAndSend(destination, payload);
      log.debug("Event successfully sent to STOMP destination: {}", destination);
    } catch (Exception e) {
      log.warn("Failed to send message to STOMP topic {}: {}", destination, e.getMessage());
    }
  }

  private UUID extractPatientId(CrossPortalEvent event) {
    if (event instanceof ScanUploadedEvent scanUploadedEvent) {
      return scanUploadedEvent.getPatientId();
    }
    if (event instanceof ClinicalReviewEvent clinicalReviewEvent) {
      return clinicalReviewEvent.getPatientId();
    }
    return null;
  }
}
