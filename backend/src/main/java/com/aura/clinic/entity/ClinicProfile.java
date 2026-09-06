package com.aura.clinic.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "clinic_profiles")
public class ClinicProfile {

  @Id
  @GeneratedValue
  @UuidGenerator
  private UUID id;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @Column(name = "organization_name", nullable = false, length = 255)
  private String organizationName;

  @Column(name = "license_number", length = 100)
  private String licenseNumber;

  @Column(name = "license_document_url", columnDefinition = "TEXT")
  private String licenseDocumentUrl;

  @Enumerated(EnumType.STRING)
  @Column(name = "verification_status", nullable = false, length = 32)
  private VerificationStatus verificationStatus = VerificationStatus.PENDING;

  @Column(name = "rejection_reason", columnDefinition = "TEXT")
  private String rejectionReason;

  @Column(name = "submitted_at", nullable = false)
  private Instant submittedAt;

  @Column(name = "reviewed_at")
  private Instant reviewedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reviewed_by")
  private User reviewedBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ClinicProfile() {}

  public ClinicProfile(User user, String organizationName, String licenseNumber, String licenseDocumentUrl) {
    this.user = user;
    this.organizationName = organizationName;
    this.licenseNumber = licenseNumber;
    this.licenseDocumentUrl = licenseDocumentUrl;
    this.verificationStatus = VerificationStatus.PENDING;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (submittedAt == null) submittedAt = now;
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

  public User getUser() {
    return user;
  }

  public String getOrganizationName() {
    return organizationName;
  }

  public void setOrganizationName(String organizationName) {
    this.organizationName = organizationName;
  }

  public String getLicenseNumber() {
    return licenseNumber;
  }

  public void setLicenseNumber(String licenseNumber) {
    this.licenseNumber = licenseNumber;
  }

  public String getLicenseDocumentUrl() {
    return licenseDocumentUrl;
  }

  public void setLicenseDocumentUrl(String licenseDocumentUrl) {
    this.licenseDocumentUrl = licenseDocumentUrl;
  }

  public VerificationStatus getVerificationStatus() {
    return verificationStatus;
  }

  public void setVerificationStatus(VerificationStatus verificationStatus) {
    this.verificationStatus = verificationStatus;
  }

  public String getRejectionReason() {
    return rejectionReason;
  }

  public void setRejectionReason(String rejectionReason) {
    this.rejectionReason = rejectionReason;
  }

  public Instant getSubmittedAt() {
    return submittedAt;
  }

  public void setSubmittedAt(Instant submittedAt) {
    this.submittedAt = submittedAt;
  }

  public Instant getReviewedAt() {
    return reviewedAt;
  }

  public void setReviewedAt(Instant reviewedAt) {
    this.reviewedAt = reviewedAt;
  }

  public User getReviewedBy() {
    return reviewedBy;
  }

  public void setReviewedBy(User reviewedBy) {
    this.reviewedBy = reviewedBy;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
