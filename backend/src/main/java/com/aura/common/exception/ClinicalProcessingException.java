package com.aura.common.exception;

/**
 * Exception thrown when clinical image ingestion fails (e.g. unsupported DICOM transfer syntax,
 * unextractable pixel stream) where synthetic fallback is strictly prohibited for clinical safety.
 */
public class ClinicalProcessingException extends RuntimeException {

  public ClinicalProcessingException(String message) {
    super(message);
  }

  public ClinicalProcessingException(String message, Throwable cause) {
    super(message, cause);
  }
}
