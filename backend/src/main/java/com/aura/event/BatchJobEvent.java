package com.aura.event;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

/**
 * Domain event dispatched when a clinic submits or updates a bulk screening batch job.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BatchJobEvent extends CrossPortalEvent {

  private static final long serialVersionUID = 1L;

  private UUID batchId;
  private UUID clinicId;
  private Integer totalScans;
  private String status;

  public BatchJobEvent() {
    super("BATCH_JOB", "CLINIC_PORTAL", "CLINIC");
  }

  public BatchJobEvent(UUID batchId, UUID clinicId, Integer totalScans, String status) {
    super("BATCH_JOB", "CLINIC_PORTAL", "CLINIC");
    this.batchId = batchId;
    this.clinicId = clinicId;
    this.totalScans = totalScans;
    this.status = status;
  }

  public UUID getBatchId() {
    return batchId;
  }

  public void setBatchId(UUID batchId) {
    this.batchId = batchId;
  }

  public UUID getClinicId() {
    return clinicId;
  }

  public void setClinicId(UUID clinicId) {
    this.clinicId = clinicId;
  }

  public Integer getTotalScans() {
    return totalScans;
  }

  public void setTotalScans(Integer totalScans) {
    this.totalScans = totalScans;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  @Override
  public String toString() {
    return "BatchJobEvent{" +
        "eventId='" + getEventId() + '\'' +
        ", batchId=" + batchId +
        ", clinicId=" + clinicId +
        ", totalScans=" + totalScans +
        ", status='" + status + '\'' +
        ", timestamp=" + getTimestamp() +
        '}';
  }
}
