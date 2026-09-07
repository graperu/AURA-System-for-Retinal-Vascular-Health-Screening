package com.aura.patient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.aura.patient.entity.PatientLabDocument;
import com.aura.patient.repository.PatientLabDocumentRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class PatientLabDocumentServiceTest {
  @Mock PatientLabDocumentRepository documentRepository;
  @Mock UserRepository userRepository;
  PatientLabDocumentService service;
  UUID patientId;

  @BeforeEach
  void setUp() {
    service = new PatientLabDocumentService(documentRepository, userRepository);
    patientId = UUID.randomUUID();
  }

  @Test
  void uploadPdfStoresBinaryContentAndMetadata() {
    User patient = new User("patient@aura.test", "hash", "Bệnh nhân A");
    MockMultipartFile file = new MockMultipartFile(
        "file", "../xet-nghiem.pdf", "application/pdf", "%PDF-data".getBytes(StandardCharsets.UTF_8));
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patient));
    when(documentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var response = service.upload(patientId, file);

    assertThat(response.fileName()).isEqualTo("xet-nghiem.pdf");
    assertThat(response.fileSize()).isEqualTo(9);
    verify(documentRepository).save(any(PatientLabDocument.class));
  }

  @Test
  void uploadRejectsUnsupportedContentType() {
    MockMultipartFile file = new MockMultipartFile(
        "file", "virus.exe", "application/octet-stream", new byte[] {1});

    assertThatThrownBy(() -> service.upload(patientId, file))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("PDF, PNG hoặc JPEG");
    verifyNoInteractions(userRepository, documentRepository);
  }

  @Test
  void uploadRejectsSpoofedPdfContent() {
    User patient = new User("patient@aura.test", "hash", "Bệnh nhân A");
    MockMultipartFile file = new MockMultipartFile(
        "file", "fake.pdf", "application/pdf", "not-a-pdf".getBytes(StandardCharsets.UTF_8));
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patient));

    assertThatThrownBy(() -> service.upload(patientId, file))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("không khớp định dạng");
    verify(documentRepository, never()).save(any());
  }

  @Test
  void deleteRequiresDocumentToBelongToPatient() {
    UUID documentId = UUID.randomUUID();
    when(documentRepository.findByIdAndPatientId(documentId, patientId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.delete(patientId, documentId))
        .hasMessageContaining("Không tìm thấy tệp xét nghiệm");
    verify(documentRepository, never()).delete(any());
  }
}
