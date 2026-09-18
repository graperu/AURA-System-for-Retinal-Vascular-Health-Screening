package com.aura.dicom;

/**
 * Extracted DICOM metadata tags for clinical fundus cameras (NFR-19).
 */
public record DicomMetadata(
    String patientName,
    String patientId,
    String modality,
    String eyeLaterality,
    String studyDate,
    Integer rows,
    Integer columns,
    boolean isDicom
) {
  public static DicomMetadata nonDicom() {
    return new DicomMetadata(null, null, null, null, null, null, null, false);
  }
}
