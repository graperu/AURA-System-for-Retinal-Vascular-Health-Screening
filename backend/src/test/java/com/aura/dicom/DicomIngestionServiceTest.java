package com.aura.dicom;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("DicomIngestionService Binary DICOM & De-Identification Tests (NFR-19)")
class DicomIngestionServiceTest {

  private DicomIngestionService dicomService;

  @BeforeEach
  void setUp() {
    dicomService = new DicomIngestionService();
  }

  @Test
  @DisplayName("isDicom returns true when DICM magic bytes exist at offset 128")
  void isDicom_validHeader_returnsTrue() throws IOException {
    byte[] validDicom = createSampleDicomBytes("Nguyen Van An", "MRN-998877", "OP", "R");

    assertThat(dicomService.isDicom(validDicom)).isTrue();
  }

  @Test
  @DisplayName("isDicom returns false for non-DICOM data (null, too short, or standard PNG)")
  void isDicom_invalidData_returnsFalse() {
    assertThat(dicomService.isDicom(null)).isFalse();
    assertThat(dicomService.isDicom(new byte[100])).isFalse();

    byte[] pngHeader = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    assertThat(dicomService.isDicom(pngHeader)).isFalse();
  }

  @Test
  @DisplayName("extractMetadata extracts PatientName, PatientID, Modality, Laterality and Dimensions")
  void extractMetadata_validDicom_extractsAllClinicalTags() throws IOException {
    byte[] dicom = createSampleDicomBytes("Tran Thi Mai", "MRN-554433", "OP", "OD");

    DicomMetadata meta = dicomService.extractMetadata(dicom);

    assertThat(meta.isDicom()).isTrue();
    assertThat(meta.patientName()).isEqualTo("Tran Thi Mai");
    assertThat(meta.patientId()).isEqualTo("MRN-554433");
    assertThat(meta.modality()).isEqualTo("OP");
    assertThat(meta.eyeLaterality()).isEqualTo("OD");
    assertThat(meta.rows()).isEqualTo(512);
    assertThat(meta.columns()).isEqualTo(512);
  }

  @Test
  @DisplayName("deidentifyDicom overwrites PatientName and PatientID with pseudonyms")
  void deidentifyDicom_replacesPhiTagsWithPseudonyms() throws IOException {
    byte[] originalDicom = createSampleDicomBytes("Pham Van Dong", "MRN-112233", "OP", "OS");

    byte[] anonymized = dicomService.deidentifyDicom(originalDicom, "ANO-PAT-7A9B1C2D", "MRN-DEID-9988");

    DicomMetadata afterMeta = dicomService.extractMetadata(anonymized);
    assertThat(afterMeta.patientName()).doesNotContain("Pham Van Dong");
    assertThat(afterMeta.patientName()).contains("ANO-PAT-7A9B1C2D");
    assertThat(afterMeta.patientId()).doesNotContain("MRN-112233");
    assertThat(afterMeta.patientId()).contains("MRN-DEID-9988");
  }

  @Test
  @DisplayName("extractPixelDataAsPng produces valid PNG image bytes from DICOM stream")
  void extractPixelDataAsPng_returnsValidPngBytes() throws IOException {
    byte[] dicom = createSampleDicomBytes("Nguyen Van B", "MRN-123456", "OP", "R");

    byte[] pngBytes = dicomService.extractPixelDataAsPng(dicom);

    assertThat(pngBytes).isNotEmpty();
    // Verify PNG magic header: 0x89, 'P', 'N', 'G'
    assertThat(pngBytes[0]).isEqualTo((byte) 0x89);
    assertThat(pngBytes[1]).isEqualTo((byte) 0x50);
    assertThat(pngBytes[2]).isEqualTo((byte) 0x4E);
    assertThat(pngBytes[3]).isEqualTo((byte) 0x47);
  }

  @Test
  @DisplayName("isDicomBase64 identifies DICOM Base64 payloads with or without data URI prefix")
  void isDicomBase64_detectsDicomPayloads() throws IOException {
    byte[] dicom = createSampleDicomBytes("Test Patient", "MRN-001", "OP", "L");
    String rawB64 = Base64.getEncoder().encodeToString(dicom);
    String dataUri = "data:application/dicom;base64," + rawB64;

    assertThat(dicomService.isDicomBase64(rawB64)).isTrue();
    assertThat(dicomService.isDicomBase64(dataUri)).isTrue();

    // Standard PNG data URI should return false
    String pngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    assertThat(dicomService.isDicomBase64(pngDataUri)).isFalse();
  }

  /**
   * Helper to construct a synthetic compliant binary DICOM dataset (PS 3.10 format).
   */
  private byte[] createSampleDicomBytes(String patientName, String patientId, String modality, String laterality) throws IOException {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();

    // 128 bytes preamble
    baos.write(new byte[128]);

    // 4 bytes magic "DICM"
    baos.write(new byte[] {(byte) 'D', (byte) 'I', (byte) 'C', (byte) 'M'});

    // Tag (0010,0010) Patient Name: VR="PN"
    writeDicomStringElement(baos, 0x0010, 0x0010, "PN", patientName);

    // Tag (0010,0020) Patient ID: VR="LO"
    writeDicomStringElement(baos, 0x0010, 0x0020, "LO", patientId);

    // Tag (0008,0060) Modality: VR="CS"
    writeDicomStringElement(baos, 0x0008, 0x0060, "CS", modality);

    // Tag (0020,0060) Laterality: VR="CS"
    writeDicomStringElement(baos, 0x0020, 0x0060, "CS", laterality);

    // Tag (0028,0010) Rows: VR="US", 512
    writeDicomShortElement(baos, 0x0028, 0x0010, (short) 512);

    // Tag (0028,0011) Columns: VR="US", 512
    writeDicomShortElement(baos, 0x0028, 0x0011, (short) 512);

    // Tag (7FE0,0010) Pixel Data: VR="OB"
    writeDicomPixelDataHeader(baos, 1024);
    baos.write(new byte[1024]); // dummy raw pixel data

    return baos.toByteArray();
  }

  private void writeDicomStringElement(ByteArrayOutputStream baos, int group, int element, String vr, String value) throws IOException {
    byte[] valBytes = value.getBytes(StandardCharsets.UTF_8);
    // Write Group and Element (little-endian)
    baos.write(group & 0xFF);
    baos.write((group >> 8) & 0xFF);
    baos.write(element & 0xFF);
    baos.write((element >> 8) & 0xFF);

    // VR (2 bytes)
    baos.write(vr.getBytes(StandardCharsets.US_ASCII));

    // Length (2 bytes for short VRs)
    baos.write(valBytes.length & 0xFF);
    baos.write((valBytes.length >> 8) & 0xFF);

    // Value
    baos.write(valBytes);
  }

  private void writeDicomShortElement(ByteArrayOutputStream baos, int group, int element, short value) throws IOException {
    baos.write(group & 0xFF);
    baos.write((group >> 8) & 0xFF);
    baos.write(element & 0xFF);
    baos.write((element >> 8) & 0xFF);
    baos.write("US".getBytes(StandardCharsets.US_ASCII));
    baos.write(2);
    baos.write(0);
    baos.write(value & 0xFF);
    baos.write((value >> 8) & 0xFF);
  }

  private void writeDicomPixelDataHeader(ByteArrayOutputStream baos, int length) throws IOException {
    baos.write(0xE0);
    baos.write(0x7F);
    baos.write(0x10);
    baos.write(0x00);
    baos.write("OB".getBytes(StandardCharsets.US_ASCII));
    baos.write(0); // reserved
    baos.write(0);
    baos.write(length & 0xFF);
    baos.write((length >> 8) & 0xFF);
    baos.write((length >> 16) & 0xFF);
    baos.write((length >> 24) & 0xFF);
  }
}
