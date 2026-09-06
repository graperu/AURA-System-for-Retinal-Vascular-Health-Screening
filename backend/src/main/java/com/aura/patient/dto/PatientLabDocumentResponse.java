package com.aura.patient.dto;

import com.aura.patient.entity.PatientLabDocument;
import java.time.Instant;
import java.util.UUID;

public record PatientLabDocumentResponse(
    UUID id,
    String fileName,
    String contentType,
    long fileSize,
    Instant uploadedAt) {
  public static PatientLabDocumentResponse fromEntity(PatientLabDocument document) {
    return new PatientLabDocumentResponse(
        document.getId(), document.getFileName(), document.getContentType(),
        document.getFileSize(), document.getUploadedAt());
  }
}
