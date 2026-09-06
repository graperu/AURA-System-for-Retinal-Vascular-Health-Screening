package com.aura.clinic.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(
    name = "clinic_members",
    uniqueConstraints = {@UniqueConstraint(name = "uq_clinic_doctor", columnNames = {"clinic_id", "doctor_id"})})
public class ClinicMember {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "clinic_id", nullable = false)
  private User clinic;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doctor_id", nullable = false)
  private User doctor;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private ClinicMemberStatus status = ClinicMemberStatus.ACTIVE;

  @Column(name = "invited_at", nullable = false)
  private Instant invitedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ClinicMember() {}

  public ClinicMember(User clinic, User doctor) {
    this.clinic = clinic;
    this.doctor = doctor;
    this.status = ClinicMemberStatus.ACTIVE;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (invitedAt == null) invitedAt = now;
    if (createdAt == null) createdAt = now;
    if (updatedAt == null) updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public User getClinic() {
    return clinic;
  }

  public User getDoctor() {
    return doctor;
  }

  public ClinicMemberStatus getStatus() {
    return status;
  }

  public void setStatus(ClinicMemberStatus status) {
    this.status = status;
  }

  public Instant getInvitedAt() {
    return invitedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
