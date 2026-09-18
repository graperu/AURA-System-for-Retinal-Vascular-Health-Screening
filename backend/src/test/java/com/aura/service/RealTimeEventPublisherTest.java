package com.aura.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.aura.controller.RealtimeSseController;
import com.aura.event.BatchJobEvent;
import com.aura.event.ClinicalReviewEvent;
import com.aura.event.ScanUploadedEvent;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class RealTimeEventPublisherTest {

  @Mock
  private SimpMessagingTemplate messagingTemplate;

  @Mock
  private ApplicationEventPublisher applicationEventPublisher;

  @Mock
  private RealtimeSseController sseController;

  private RealTimeEventPublisher publisher;

  @BeforeEach
  void setUp() {
    publisher = new RealTimeEventPublisher(messagingTemplate, applicationEventPublisher, sseController);
  }

  @Test
  void testPublishScanUploadedEvent() {
    UUID scanId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ScanUploadedEvent event = new ScanUploadedEvent(scanId, patientId, "Patient A", "OD", 0.8);

    publisher.publish(event);

    verify(messagingTemplate).convertAndSend(eq("/topic/portal-sync"), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/doctor/scans"), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/patient/" + patientId), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/admin/activity"), eq(event));
    verify(sseController).broadcast(event);
    verify(applicationEventPublisher).publishEvent(event);
  }

  @Test
  void testPublishClinicalReviewEvent() {
    UUID reviewId = UUID.randomUUID();
    UUID scanId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ClinicalReviewEvent event = new ClinicalReviewEvent(reviewId, scanId, patientId, "Dr. House", "APPROVED", "Clear scan");

    publisher.publish(event);

    verify(messagingTemplate).convertAndSend(eq("/topic/portal-sync"), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/doctor/scans"), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/patient/" + patientId), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/admin/activity"), eq(event));
    verify(sseController).broadcast(event);
    verify(applicationEventPublisher).publishEvent(event);
  }

  @Test
  void testPublishBatchJobEvent() {
    UUID batchId = UUID.randomUUID();
    UUID clinicId = UUID.randomUUID();
    BatchJobEvent event = new BatchJobEvent(batchId, clinicId, 25, "COMPLETED");

    publisher.publish(event);

    verify(messagingTemplate).convertAndSend(eq("/topic/portal-sync"), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/admin/activity"), eq(event));
    verify(messagingTemplate).convertAndSend(eq("/topic/clinic/" + clinicId), eq(event));
    verify(sseController).broadcast(event);
  }

  @Test
  void testPublishHelperMethods() {
    UUID scanId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    publisher.publishScanUploaded(scanId, patientId, "Test Patient", "OS", 0.45);

    verify(messagingTemplate).convertAndSend(eq("/topic/portal-sync"), any(ScanUploadedEvent.class));
    verify(messagingTemplate).convertAndSend(eq("/topic/doctor/scans"), any(ScanUploadedEvent.class));

    UUID reviewId = UUID.randomUUID();
    publisher.publishClinicalReview(reviewId, scanId, patientId, "Dr. Stone", "REVIEWED", "Checked");
    verify(messagingTemplate).convertAndSend(eq("/topic/portal-sync"), any(ClinicalReviewEvent.class));

    UUID batchId = UUID.randomUUID();
    UUID clinicId = UUID.randomUUID();
    publisher.publishBatchJob(batchId, clinicId, 10, "QUEUED");
    verify(messagingTemplate).convertAndSend(eq("/topic/portal-sync"), any(BatchJobEvent.class));
  }

  @Test
  void testPublishNullDoesNotThrow() {
    publisher.publish(null);
    verifyNoInteractions(messagingTemplate);
    verifyNoInteractions(sseController);
  }

  @Test
  void testPublishWhenMessagingTemplateNullDoesNotThrow() {
    RealTimeEventPublisher noBrokerPublisher = new RealTimeEventPublisher(null, applicationEventPublisher, sseController);
    ScanUploadedEvent event = new ScanUploadedEvent(UUID.randomUUID(), UUID.randomUUID(), "Patient", "OD", 0.1);

    noBrokerPublisher.publish(event);
    verify(sseController).broadcast(event);
  }

  @Test
  void testGettersAndSetters() {
    assertThat(publisher.getMessagingTemplate()).isEqualTo(messagingTemplate);
    publisher.setSseController(null);
    publisher.sendToDestination("/topic/custom", "message");
    verify(messagingTemplate).convertAndSend("/topic/custom", "message");
  }
}
