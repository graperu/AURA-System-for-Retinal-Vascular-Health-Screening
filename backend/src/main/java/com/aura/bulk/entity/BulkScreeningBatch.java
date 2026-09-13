package com.aura.bulk.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "bulk_screening_batches")
public class BulkScreeningBatch {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @Column(name = "batch_code", nullable = false, unique = true, length = 100)
  private String batchCode;

  @Column(name = "clinic_id", nullable = false)
  private UUID clinicId;

  @Column(name = "total_images", nullable = false)
  private Integer totalImages = 0;

  @Column(name = "processed_count", nullable = false)
  private Integer processedCount = 0;

  @Column(name = "failed_count", nullable = false)
  private Integer failedCount = 0;

  @Column(name = "status", nullable = false, length = 32)
  private String status = "QUEUED";

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public BulkScreeningBatch() {}

  public BulkScreeningBatch(String batchCode, UUID clinicId, Integer totalImages) {
    this.batchCode = batchCode;
    this.clinicId = clinicId;
    this.totalImages = totalImages != null ? totalImages : 0;
    this.processedCount = 0;
    this.failedCount = 0;
    this.status = "QUEUED";
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getBatchCode() {
    return batchCode;
  }

  public void setBatchCode(String batchCode) {
    this.batchCode = batchCode;
  }

  public UUID getClinicId() {
    return clinicId;
  }

  public void setClinicId(UUID clinicId) {
    this.clinicId = clinicId;
  }

  public Integer getTotalImages() {
    return totalImages;
  }

  public void setTotalImages(Integer totalImages) {
    this.totalImages = totalImages;
  }

  public Integer getProcessedCount() {
    return processedCount;
  }

  public void setProcessedCount(Integer processedCount) {
    this.processedCount = processedCount;
  }

  public Integer getFailedCount() {
    return failedCount;
  }

  public void setFailedCount(Integer failedCount) {
    this.failedCount = failedCount;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
