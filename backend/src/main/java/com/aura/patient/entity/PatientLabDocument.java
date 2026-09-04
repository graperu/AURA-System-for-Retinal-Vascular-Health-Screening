package com.aura.patient.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "patient_lab_documents")
public class PatientLabDocument {

  @Id @GeneratedValue @UuidGenerator private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "patient_id", nullable = false)
  private User patient;

  @Column(name = "file_name", nullable = false, length = 255)
  private String fileName;

  @Column(name = "content_type", nullable = false, length = 100)
  private String contentType;

  @Column(name = "file_size", nullable = false)
  private long fileSize;

  @Column(name = "content", nullable = false, columnDefinition = "BYTEA")
  private byte[] content;

  @Column(name = "uploaded_at", nullable = false, updatable = false)
  private Instant uploadedAt;

  protected PatientLabDocument() {}

  public PatientLabDocument(User patient, String fileName, String contentType, byte[] content) {
    this.patient = patient;
    this.fileName = fileName;
    this.contentType = contentType;
    this.content = content;
    this.fileSize = content.length;
  }

  @PrePersist
  void onCreate() {
    if (uploadedAt == null) uploadedAt = Instant.now();
  }

  public UUID getId() { return id; }
  public User getPatient() { return patient; }
  public String getFileName() { return fileName; }
  public String getContentType() { return contentType; }
  public long getFileSize() { return fileSize; }
  public byte[] getContent() { return content; }
  public Instant getUploadedAt() { return uploadedAt; }
}
