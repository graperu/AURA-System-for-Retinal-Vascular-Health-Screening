package com.aura.patient.service;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.dto.PatientLabDocumentResponse;
import com.aura.patient.entity.PatientLabDocument;
import com.aura.patient.repository.PatientLabDocumentRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PatientLabDocumentService {
  static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
  private static final Set<String> ALLOWED_TYPES = Set.of(
      "application/pdf", "image/png", "image/jpeg");

  private final PatientLabDocumentRepository documentRepository;
  private final UserRepository userRepository;

  public PatientLabDocumentService(
      PatientLabDocumentRepository documentRepository, UserRepository userRepository) {
    this.documentRepository = documentRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<PatientLabDocumentResponse> list(UUID patientId) {
    return documentRepository.findByPatientIdOrderByUploadedAtDesc(patientId).stream()
        .map(PatientLabDocumentResponse::fromEntity)
        .toList();
  }

  @Transactional
  public PatientLabDocumentResponse upload(UUID patientId, MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new IllegalArgumentException("Tệp xét nghiệm không được để trống");
    }
    if (file.getSize() > MAX_FILE_SIZE) {
      throw new IllegalArgumentException("Tệp xét nghiệm không được vượt quá 10 MB");
    }
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
      throw new IllegalArgumentException("Chỉ chấp nhận tệp PDF, PNG hoặc JPEG");
    }
    String fileName = sanitizeFileName(file.getOriginalFilename());
    User patient = userRepository.findById(patientId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân với ID: " + patientId));
    try {
      byte[] content = file.getBytes();
      validateSignature(contentType.toLowerCase(), content);
      PatientLabDocument saved = documentRepository.save(
          new PatientLabDocument(patient, fileName, contentType.toLowerCase(), content));
      return PatientLabDocumentResponse.fromEntity(saved);
    } catch (IOException e) {
      throw new IllegalArgumentException("Không thể đọc nội dung tệp xét nghiệm");
    }
  }

  @Transactional(readOnly = true)
  public PatientLabDocument getContent(UUID patientId, UUID documentId) {
    return documentRepository.findByIdAndPatientId(documentId, patientId)
        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tệp xét nghiệm trong hồ sơ bệnh nhân"));
  }

  @Transactional
  public void delete(UUID patientId, UUID documentId) {
    documentRepository.delete(getContent(patientId, documentId));
  }

  private String sanitizeFileName(String original) {
    String name = original == null ? "ket-qua-xet-nghiem" : original.replace('\\', '/');
    name = name.substring(name.lastIndexOf('/') + 1).trim();
    if (name.isBlank()) name = "ket-qua-xet-nghiem";
    return name.length() > 255 ? name.substring(name.length() - 255) : name;
  }

  private void validateSignature(String contentType, byte[] content) {
    boolean valid = switch (contentType) {
      case "application/pdf" -> content.length >= 4
          && content[0] == '%' && content[1] == 'P' && content[2] == 'D' && content[3] == 'F';
      case "image/png" -> content.length >= 8
          && (content[0] & 0xff) == 0x89 && content[1] == 'P' && content[2] == 'N' && content[3] == 'G';
      case "image/jpeg" -> content.length >= 3
          && (content[0] & 0xff) == 0xff && (content[1] & 0xff) == 0xd8 && (content[2] & 0xff) == 0xff;
      default -> false;
    };
    if (!valid) throw new IllegalArgumentException("Nội dung tệp không khớp định dạng PDF, PNG hoặc JPEG");
  }
}
