package com.aura.patient.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.common.exception.ResourceNotFoundException;
import com.aura.patient.dto.PatientLabDocumentResponse;
import com.aura.patient.entity.PatientLabDocument;
import com.aura.patient.repository.PatientLabDocumentRepository;
import com.aura.user.entity.User;
import com.aura.user.repository.UserRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("PatientLabDocumentService - Optimized Boundary & Magic Bytes Unit Tests")
class PatientLabDocumentServiceOptimizedTest {

  @Mock private PatientLabDocumentRepository documentRepository;
  @Mock private UserRepository userRepository;

  private PatientLabDocumentService service;
  private UUID patientId;
  private User patientUser;

  @BeforeEach
  void setUp() {
    service = new PatientLabDocumentService(documentRepository, userRepository);
    patientId = UUID.randomUUID();
    patientUser = new User("patient@aura.test", "hash", "Benh Nhan Test");
  }

  @Test
  @DisplayName("Upload: File null phải ném ngoại lệ 'Tệp xét nghiệm không được để trống'")
  void testUploadNullFileThrows() {
    assertThatThrownBy(() -> service.upload(patientId, null))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Tệp xét nghiệm không được để trống");
  }

  @ParameterizedTest
  @ValueSource(strings = {"application/pdf", "image/png", "image/jpeg"})
  @DisplayName("Upload: File rỗng (0 bytes) với các MIME types hợp lệ phải ném ngoại lệ 'Tệp xét nghiệm không được để trống'")
  void testUploadEmptyFileThrows(String mimeType) {
    MockMultipartFile emptyFile = new MockMultipartFile("file", "test.dat", mimeType, new byte[0]);

    assertThatThrownBy(() -> service.upload(patientId, emptyFile))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Tệp xét nghiệm không được để trống");
    verify(documentRepository, never()).save(any());
  }

  @Test
  @DisplayName("Upload: File vượt quá 10MB phải ném ngoại lệ 'Tệp xét nghiệm không được vượt quá 10 MB'")
  void testUploadOversizedFileThrows() {
    MockMultipartFile oversized = new MockMultipartFile(
        "file", "large.pdf", "application/pdf", new byte[10]
    ) {
      @Override
      public long getSize() {
        return 10L * 1024 * 1024 + 1; // 10MB + 1 byte
      }
    };

    assertThatThrownBy(() -> service.upload(patientId, oversized))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Tệp xét nghiệm không được vượt quá 10 MB");
  }

  @ParameterizedTest(name = "Magic bytes spoof check: mime={0}, bytesLen={1}")
  @MethodSource("provideSpoofedMagicByteCases")
  @DisplayName("Upload: Mime-type spoofed hoặc magic bytes không đủ/sai định dạng phải bị từ chối")
  void testUploadMimeTypeSpoofedOrInvalidMagicBytesThrows(String mimeType, byte[] content, String expectedMsgPart) {
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    MockMultipartFile file = new MockMultipartFile("file", "test-doc.file", mimeType, content);

    assertThatThrownBy(() -> service.upload(patientId, file))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining(expectedMsgPart);
    verify(documentRepository, never()).save(any());
  }

  static Stream<Arguments> provideSpoofedMagicByteCases() {
    return Stream.of(
        // PDF: length < 4
        Arguments.of("application/pdf", new byte[] {'%', 'P', 'D'}, "không khớp định dạng"),
        // PDF: length >= 4 but invalid header
        Arguments.of("application/pdf", "NOT_PDF_HEADER".getBytes(StandardCharsets.UTF_8), "không khớp định dạng"),
        // PNG: length < 8 (e.g. 7 bytes)
        Arguments.of("image/png", new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A}, "không khớp định dạng"),
        // PNG: length >= 8 but bad magic byte (first byte 0x00 instead of 0x89)
        Arguments.of("image/png", new byte[] {0x00, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}, "không khớp định dạng"),
        // JPEG: length < 3 (e.g. 2 bytes)
        Arguments.of("image/jpeg", new byte[] {(byte) 0xFF, (byte) 0xD8}, "không khớp định dạng"),
        // JPEG: length >= 3 but bad header (0xFF, 0x00, 0xFF)
        Arguments.of("image/jpeg", new byte[] {(byte) 0xFF, 0x00, (byte) 0xFF, 0x00}, "không khớp định dạng")
    );
  }

  @ParameterizedTest(name = "Valid magic bytes upload: mime={0}")
  @MethodSource("provideValidMagicByteCases")
  @DisplayName("Upload: File với magic bytes chuẩn PDF, PNG, JPEG phải upload thành công")
  void testUploadValidMagicBytesSuccess(String mimeType, String fileName, byte[] validBytes) {
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(documentRepository.save(any(PatientLabDocument.class))).thenAnswer(inv -> inv.getArgument(0));

    MockMultipartFile file = new MockMultipartFile("file", fileName, mimeType, validBytes);

    PatientLabDocumentResponse res = service.upload(patientId, file);

    assertThat(res).isNotNull();
    assertThat(res.contentType()).isEqualTo(mimeType.toLowerCase());
    verify(documentRepository).save(any(PatientLabDocument.class));
  }

  static Stream<Arguments> provideValidMagicByteCases() {
    byte[] validPdf = "%PDF-1.7 Test document".getBytes(StandardCharsets.UTF_8);
    byte[] validPng = new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};
    byte[] validJpeg = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16};

    return Stream.of(
        Arguments.of("application/pdf", "blood_test.pdf", validPdf),
        Arguments.of("image/png", "retina_scan.png", validPng),
        Arguments.of("image/jpeg", "fundus.jpg", validJpeg)
    );
  }

  @Test
  @DisplayName("Upload: Filename dài hơn 255 ký tự được cắt ngắn thành đúng 255 ký tự cuối")
  void testUploadLongFilenameOver255CharsTruncatesSafely() {
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(documentRepository.save(any(PatientLabDocument.class))).thenAnswer(inv -> inv.getArgument(0));

    String prefix = "A".repeat(250);
    String suffix = "_important_blood_report.pdf"; // total 277 chars
    String veryLongName = prefix + suffix;

    byte[] validPdf = "%PDF-1.4 Data".getBytes(StandardCharsets.UTF_8);
    MockMultipartFile file = new MockMultipartFile("file", veryLongName, "application/pdf", validPdf);

    service.upload(patientId, file);

    ArgumentCaptor<PatientLabDocument> captor = ArgumentCaptor.forClass(PatientLabDocument.class);
    verify(documentRepository).save(captor.capture());

    String savedFileName = captor.getValue().getFileName();
    assertThat(savedFileName).hasSize(255);
    assertThat(savedFileName).endsWith(suffix);
  }

  @Test
  @DisplayName("Upload: Filename có đường dẫn thư mục Windows '\\' và rỗng/blank fallback về 'ket-qua-xet-nghiem'")
  void testUploadFilenamePathSeparatorsAndBlankFallback() {
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));
    when(documentRepository.save(any(PatientLabDocument.class))).thenAnswer(inv -> inv.getArgument(0));

    byte[] validPdf = "%PDF-1.4 Data".getBytes(StandardCharsets.UTF_8);
    MockMultipartFile fileWithPath = new MockMultipartFile(
        "file", "C:\\fakepath\\subfolder\\real_report.pdf", "application/pdf", validPdf);

    service.upload(patientId, fileWithPath);

    ArgumentCaptor<PatientLabDocument> captor = ArgumentCaptor.forClass(PatientLabDocument.class);
    verify(documentRepository).save(captor.capture());
    assertThat(captor.getValue().getFileName()).isEqualTo("real_report.pdf");

    // Blank original name fallback
    MockMultipartFile fileBlank = new MockMultipartFile("file", "   ", "application/pdf", validPdf);
    service.upload(patientId, fileBlank);
    verify(documentRepository, org.mockito.Mockito.times(2)).save(captor.capture());
    assertThat(captor.getValue().getFileName()).isEqualTo("ket-qua-xet-nghiem");

    // Null original name fallback
    MockMultipartFile fileNullName = new MockMultipartFile("file", null, "application/pdf", validPdf);
    service.upload(patientId, fileNullName);
    verify(documentRepository, org.mockito.Mockito.times(3)).save(captor.capture());
    assertThat(captor.getValue().getFileName()).isEqualTo("ket-qua-xet-nghiem");
  }

  @Test
  @DisplayName("Upload: contentType == null phải ném IllegalArgumentException 'Chỉ chấp nhận tệp PDF, PNG hoặc JPEG'")
  void testUploadNullContentTypeThrows() {
    MockMultipartFile nullContentTypeFile = new MockMultipartFile("file", "doc.dat", null, new byte[] {1, 2, 3});

    assertThatThrownBy(() -> service.upload(patientId, nullContentTypeFile))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Chỉ chấp nhận tệp PDF, PNG hoặc JPEG");
  }

  @Test
  @DisplayName("Upload: Không tìm thấy bệnh nhân trong userRepository -> ném ResourceNotFoundException")
  void testUploadPatientUserNotFoundThrows() {
    when(userRepository.findById(patientId)).thenReturn(Optional.empty());

    byte[] validPdf = "%PDF-1.4 Data".getBytes(StandardCharsets.UTF_8);
    MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", validPdf);

    assertThatThrownBy(() -> service.upload(patientId, file))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessage("Không tìm thấy bệnh nhân với ID: " + patientId);
  }

  @ParameterizedTest(name = "validateSignature reflection test: type={0}, len={1}")
  @MethodSource("provideValidateSignatureReflectionCases")
  @DisplayName("validateSignature: switch default (type lạ) và các biên độ dài không đủ đều ném IllegalArgumentException")
  void testValidateSignatureDirectReflection(String contentType, byte[] content) {
    java.lang.reflect.Method method;
    try {
      method = PatientLabDocumentService.class.getDeclaredMethod("validateSignature", String.class, byte[].class);
      method.setAccessible(true);
    } catch (NoSuchMethodException e) {
      throw new RuntimeException(e);
    }

    assertThatThrownBy(() -> {
      try {
        method.invoke(service, contentType, content);
      } catch (java.lang.reflect.InvocationTargetException ite) {
        throw ite.getCause();
      }
    }).isInstanceOf(IllegalArgumentException.class)
      .hasMessage("Nội dung tệp không khớp định dạng PDF, PNG hoặc JPEG");
  }

  static Stream<Arguments> provideValidateSignatureReflectionCases() {
    return Stream.of(
        Arguments.of("application/unknown", new byte[] {1, 2, 3, 4, 5}),
        Arguments.of("text/plain", "Hello world".getBytes(StandardCharsets.UTF_8)),
        Arguments.of("application/pdf", new byte[] {'%', 'P'}), // len < 4
        Arguments.of("application/pdf", new byte[] {'A', 'B', 'C', 'D'}), // len >= 4, wrong magic bytes
        Arguments.of("image/png", new byte[] {(byte) 0x89, 'P', 'N'}), // len < 8
        Arguments.of("image/png", new byte[] {(byte) 0x00, 'P', 'N', 'G', 0, 0, 0, 0}), // len >= 8, wrong magic
        Arguments.of("image/jpeg", new byte[] {(byte) 0xFF}), // len < 3
        Arguments.of("image/jpeg", new byte[] {(byte) 0xFF, (byte) 0x00, (byte) 0x00}) // len >= 3, wrong magic
    );
  }

  @Test
  @DisplayName("Upload: Khi file ném IOException khi getBytes() -> chuyển thành IllegalArgumentException")
  void testUploadIOExceptionThrowsIllegalArgumentException() throws Exception {
    when(userRepository.findById(patientId)).thenReturn(Optional.of(patientUser));

    MultipartFile throwingFile = org.mockito.Mockito.mock(MultipartFile.class);
    when(throwingFile.isEmpty()).thenReturn(false);
    when(throwingFile.getSize()).thenReturn(100L);
    when(throwingFile.getContentType()).thenReturn("application/pdf");
    when(throwingFile.getOriginalFilename()).thenReturn("test.pdf");
    when(throwingFile.getBytes()).thenThrow(new IOException("Disk read error"));

    assertThatThrownBy(() -> service.upload(patientId, throwingFile))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Không thể đọc nội dung tệp xét nghiệm");
  }

  @Test
  @DisplayName("List, getContent, Delete: Bao phủ đầy đủ các luồng thành công và không tìm thấy tài liệu")
  void testListGetContentAndDelete() {
    UUID docId = UUID.randomUUID();
    PatientLabDocument doc = new PatientLabDocument(patientUser, "scan.pdf", "application/pdf", "%PDF".getBytes());
    ReflectionTestUtils.setField(doc, "id", docId);

    when(documentRepository.findByPatientIdOrderByUploadedAtDesc(patientId)).thenReturn(List.of(doc));
    when(documentRepository.findByIdAndPatientId(docId, patientId)).thenReturn(Optional.of(doc));

    List<PatientLabDocumentResponse> list = service.list(patientId);
    assertThat(list).hasSize(1);
    assertThat(list.get(0).fileName()).isEqualTo("scan.pdf");

    PatientLabDocument content = service.getContent(patientId, docId);
    assertThat(content).isNotNull();
    assertThat(content.getFileName()).isEqualTo("scan.pdf");

    service.delete(patientId, docId);
    verify(documentRepository).delete(doc);

    // Not found getContent
    UUID notFoundDocId = UUID.randomUUID();
    when(documentRepository.findByIdAndPatientId(notFoundDocId, patientId)).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.getContent(patientId, notFoundDocId))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Không tìm thấy tệp xét nghiệm trong hồ sơ bệnh nhân");
  }
}
