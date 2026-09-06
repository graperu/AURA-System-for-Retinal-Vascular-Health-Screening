package com.aura.family.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "family_member")
public class FamilyMember {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @Column(name = "owner_user_id", nullable = false)
  private UUID ownerUserId;

  @Column(name = "display_name", nullable = false, length = 150)
  private String displayName;

  @Column(nullable = false, length = 32)
  private String relationship;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(length = 32)
  private String gender;

  @Column(name = "is_active", nullable = false)
  private boolean active;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected FamilyMember() {}

  public FamilyMember(UUID ownerUserId, String displayName, String relationship, LocalDate dateOfBirth, String gender) {
    this.ownerUserId = ownerUserId;
    this.displayName = displayName;
    this.relationship = relationship;
    this.dateOfBirth = dateOfBirth;
    this.gender = gender;
  }

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public UUID getId() {
    return id;
  }

  public UUID getOwnerUserId() {
    return ownerUserId;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getRelationship() {
    return relationship;
  }

  public void setRelationship(String relationship) {
    this.relationship = relationship;
  }

  public LocalDate getDateOfBirth() {
    return dateOfBirth;
  }

  public void setDateOfBirth(LocalDate dateOfBirth) {
    this.dateOfBirth = dateOfBirth;
  }

  public String getGender() {
    return gender;
  }

  public void setGender(String gender) {
    this.gender = gender;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
