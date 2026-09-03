package com.aura.doctor.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "doctor_patient_assignments", uniqueConstraints = {
    @UniqueConstraint(name = "uq_doctor_patient_assignment", columnNames = {"doctor_id", "patient_id"})
})
public class DoctorPatientAssignment {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doctor_id", nullable = false)
  private User doctor;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_id", nullable = false)
  private User patient;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private AssignmentStatus status = AssignmentStatus.ACTIVE;

  @Column(name = "assigned_at", nullable = false)
  private Instant assignedAt;

  @Column(name = "assigned_by")
  private UUID assignedBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected DoctorPatientAssignment() {}

  public DoctorPatientAssignment(User doctor, User patient, AssignmentStatus status, UUID assignedBy) {
    this.doctor = doctor;
    this.patient = patient;
    this.status = status != null ? status : AssignmentStatus.ACTIVE;
    this.assignedBy = assignedBy;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (assignedAt == null) {
      assignedAt = now;
    }
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

  public User getDoctor() {
    return doctor;
  }

  public void setDoctor(User doctor) {
    this.doctor = doctor;
  }

  public User getPatient() {
    return patient;
  }

  public void setPatient(User patient) {
    this.patient = patient;
  }

  public AssignmentStatus getStatus() {
    return status;
  }

  public void setStatus(AssignmentStatus status) {
    this.status = status;
  }

  public Instant getAssignedAt() {
    return assignedAt;
  }

  public void setAssignedAt(Instant assignedAt) {
    this.assignedAt = assignedAt;
  }

  public UUID getAssignedBy() {
    return assignedBy;
  }

  public void setAssignedBy(UUID assignedBy) {
    this.assignedBy = assignedBy;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
