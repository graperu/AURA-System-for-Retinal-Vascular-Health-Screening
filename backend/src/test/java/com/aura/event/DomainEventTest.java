package com.aura.event;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class DomainEventTest {

  @Test
  void testScanUploadedEvent() {
    UUID scanId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ScanUploadedEvent event = new ScanUploadedEvent(scanId, patientId, "Nguyen Van A", "OD", 0.75);

    assertThat(event.getEventId()).isNotBlank();
    assertThat(event.getEventType()).isEqualTo("SCAN_UPLOADED");
    assertThat(event.getPortalSource()).isEqualTo("PATIENT_PORTAL");
    assertThat(event.getTargetRole()).isEqualTo("DOCTOR");
    assertThat(event.getScanId()).isEqualTo(scanId);
    assertThat(event.getPatientId()).isEqualTo(patientId);
    assertThat(event.getPatientName()).isEqualTo("Nguyen Van A");
    assertThat(event.getEye()).isEqualTo("OD");
    assertThat(event.getRiskScore()).isEqualTo(0.75);
    assertThat(event.getTimestamp()).isPositive();
    assertThat(event.getPayload()).isNotNull();
    assertThat(event.toString()).contains("ScanUploadedEvent");

    // Test setters
    event.setEye("OS");
    assertThat(event.getEye()).isEqualTo("OS");
    event.setRiskScore(0.85);
    assertThat(event.getRiskScore()).isEqualTo(0.85);
    event.setPatientName("Tran Van B");
    assertThat(event.getPatientName()).isEqualTo("Tran Van B");
    UUID newScanId = UUID.randomUUID();
    event.setScanId(newScanId);
    assertThat(event.getScanId()).isEqualTo(newScanId);
    UUID newPatientId = UUID.randomUUID();
    event.setPatientId(newPatientId);
    assertThat(event.getPatientId()).isEqualTo(newPatientId);
  }

  @Test
  void testClinicalReviewEvent() {
    UUID reviewId = UUID.randomUUID();
    UUID scanId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ClinicalReviewEvent event = new ClinicalReviewEvent(reviewId, scanId, patientId, "Dr. Smith", "APPROVED", "Normal retina");

    assertThat(event.getEventId()).isNotBlank();
    assertThat(event.getEventType()).isEqualTo("CLINICAL_REVIEW");
    assertThat(event.getPortalSource()).isEqualTo("DOCTOR_PORTAL");
    assertThat(event.getTargetRole()).isEqualTo("PATIENT");
    assertThat(event.getReviewId()).isEqualTo(reviewId);
    assertThat(event.getScanId()).isEqualTo(scanId);
    assertThat(event.getPatientId()).isEqualTo(patientId);
    assertThat(event.getDoctorName()).isEqualTo("Dr. Smith");
    assertThat(event.getStatus()).isEqualTo("APPROVED");
    assertThat(event.getNotes()).isEqualTo("Normal retina");
    assertThat(event.toString()).contains("ClinicalReviewEvent");

    // Test setters
    UUID newReviewId = UUID.randomUUID();
    event.setReviewId(newReviewId);
    assertThat(event.getReviewId()).isEqualTo(newReviewId);
    event.setDoctorName("Dr. Johnson");
    assertThat(event.getDoctorName()).isEqualTo("Dr. Johnson");
    event.setStatus("REJECTED");
    assertThat(event.getStatus()).isEqualTo("REJECTED");
    event.setNotes("Artifact detected");
    assertThat(event.getNotes()).isEqualTo("Artifact detected");
  }

  @Test
  void testBatchJobEvent() {
    UUID batchId = UUID.randomUUID();
    UUID clinicId = UUID.randomUUID();
    BatchJobEvent event = new BatchJobEvent(batchId, clinicId, 50, "PROCESSING");

    assertThat(event.getEventId()).isNotBlank();
    assertThat(event.getEventType()).isEqualTo("BATCH_JOB");
    assertThat(event.getPortalSource()).isEqualTo("CLINIC_PORTAL");
    assertThat(event.getTargetRole()).isEqualTo("CLINIC");
    assertThat(event.getBatchId()).isEqualTo(batchId);
    assertThat(event.getClinicId()).isEqualTo(clinicId);
    assertThat(event.getTotalScans()).isEqualTo(50);
    assertThat(event.getStatus()).isEqualTo("PROCESSING");
    assertThat(event.toString()).contains("BatchJobEvent");

    // Test setters
    UUID newBatchId = UUID.randomUUID();
    event.setBatchId(newBatchId);
    assertThat(event.getBatchId()).isEqualTo(newBatchId);
    UUID newClinicId = UUID.randomUUID();
    event.setClinicId(newClinicId);
    assertThat(event.getClinicId()).isEqualTo(newClinicId);
    event.setTotalScans(100);
    assertThat(event.getTotalScans()).isEqualTo(100);
    event.setStatus("COMPLETED");
    assertThat(event.getStatus()).isEqualTo("COMPLETED");
  }

  @Test
  void testBaseCrossPortalEventProperties() {
    ScanUploadedEvent event = new ScanUploadedEvent();
    event.setEventId("EVT-CUSTOM-123");
    event.setEventType("CUSTOM_TYPE");
    event.setTimestamp(1700000000000L);
    event.setPortalSource("ADMIN_PORTAL");
    event.setTargetRole("ADMIN");
    event.setPayload("CustomPayload");

    assertThat(event.getEventId()).isEqualTo("EVT-CUSTOM-123");
    assertThat(event.getEventType()).isEqualTo("CUSTOM_TYPE");
    assertThat(event.getTimestamp()).isEqualTo(1700000000000L);
    assertThat(event.getPortalSource()).isEqualTo("ADMIN_PORTAL");
    assertThat(event.getTargetRole()).isEqualTo("ADMIN");
    assertThat(event.getPayload()).isEqualTo("CustomPayload");
  }
}
