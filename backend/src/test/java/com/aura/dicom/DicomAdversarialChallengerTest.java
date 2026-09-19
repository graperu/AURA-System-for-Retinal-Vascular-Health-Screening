package com.aura.dicom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.aura.common.exception.ClinicalProcessingException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Random;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Adversarial Challenger Test Suite for DICOM Safety & Sequence Parsing (MED-01 & MED-02).
 * Verifies that:
 * 1. Cartoon eye synthesis is completely eliminated and malformed/non-JPEG pixel streams fail-closed with ClinicalProcessingException.
 * 2. Undefined length sequences (0xFFFFFFFF) do NOT abort early and subsequent PHI tags are reached and anonymized.
 * 3. Nested sequences with multiple delimiters track sequence depth accurately.
 * 4. Investigates boundary conditions such as HIPAA PHI tags (PatientBirthDate) and false delimiters.
 */
@DisplayName("Challenger M2.1: Adversarial DICOM Safety & Sequence Parsing Stress Tests")
public class DicomAdversarialChallengerTest {

  private DicomIngestionService dicomService;

  @BeforeEach
  void setUp() {
    dicomService = new DicomIngestionService();
  }

  // =========================================================================
  // GROUP 1: MED-01 Cartoon Eye Elimination & Fail-Closed Pixel Extraction
  // =========================================================================
  @Nested
  @DisplayName("MED-01: Fail-Closed Pixel Extraction (Cartoon Eye Elimination)")
  class Med01AdversarialTests {

    @Test
    @DisplayName("Corrupt DICOM with completely random binary bytes throws ClinicalProcessingException")
    void extractPixelData_completelyRandomBytes_throwsClinicalProcessingException() {
      byte[] randomBytes = new byte[2048];
      new Random(42).nextBytes(randomBytes);
      // Even if DICM magic is injected, random bytes have no valid JPEG SOI
      System.arraycopy(new byte[] {'D', 'I', 'C', 'M'}, 0, randomBytes, 128, 4);

      assertThatThrownBy(() -> dicomService.extractPixelDataAsPng(randomBytes))
          .isInstanceOf(ClinicalProcessingException.class)
          .hasMessageContaining("synthetic fallback");
    }

    @Test
    @DisplayName("Truncated DICOM with preamble only throws ClinicalProcessingException")
    void extractPixelData_truncatedPreambleOnly_throwsClinicalProcessingException() {
      byte[] preambleOnly = new byte[132];
      System.arraycopy(new byte[] {'D', 'I', 'C', 'M'}, 0, preambleOnly, 128, 4);

      assertThatThrownBy(() -> dicomService.extractPixelDataAsPng(preambleOnly))
          .isInstanceOf(ClinicalProcessingException.class)
          .hasMessageContaining("synthetic fallback");
    }

    @Test
    @DisplayName("DICOM with raw uncompressed native pixel data (Explicit VR Little Endian) throws ClinicalProcessingException")
    void extractPixelData_rawNativeUncompressedPixels_throwsClinicalProcessingException() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", "Doe^John");
      writeDicomShortElement(baos, 0x0028, 0x0010, (short) 256); // Rows
      writeDicomShortElement(baos, 0x0028, 0x0011, (short) 256); // Columns
      // Uncompressed raw 8-bit grayscale pixel data (256 * 256 = 65536 bytes of raster, NO JPEG marker)
      byte[] rawPixels = new byte[65536];
      Arrays.fill(rawPixels, (byte) 128);
      writeDicomPixelDataHeader(baos, rawPixels.length);
      baos.write(rawPixels);

      byte[] dicomBytes = baos.toByteArray();

      // Must throw ClinicalProcessingException rather than drawing synthetic eye
      assertThatThrownBy(() -> dicomService.extractPixelDataAsPng(dicomBytes))
          .isInstanceOf(ClinicalProcessingException.class)
          .hasMessageContaining("synthetic fallback")
          .hasMessageContaining("Transfer Syntax không được hỗ trợ");
    }

    @Test
    @DisplayName("Corrupt JPEG marker (SOI 0xFFD8FF followed by truncated invalid Huffman/SOS) throws ClinicalProcessingException")
    void extractPixelData_corruptJpegMarker_throwsClinicalProcessingException() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});
      writeDicomPixelDataHeader(baos, 16);
      // False/corrupted JPEG SOI marker followed by immediate EOF or garbage
      baos.write(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x12, 0x34, 0x56, 0x78});

      byte[] corruptDicom = baos.toByteArray();

      assertThatThrownBy(() -> dicomService.extractPixelDataAsPng(corruptDicom))
          .isInstanceOf(ClinicalProcessingException.class)
          .hasMessageContaining("synthetic fallback");
    }

    @Test
    @DisplayName("Empty byte array has no pixel data and throws ClinicalProcessingException")
    void extractPixelData_emptyArray_throwsClinicalProcessingException() {
      byte[] empty = new byte[0];
      assertThatThrownBy(() -> dicomService.extractPixelDataAsPng(empty))
          .isInstanceOf(ClinicalProcessingException.class);
    }
  }

  // =========================================================================
  // GROUP 2: MED-02 Undefined Length Sequences & HIPAA PHI Boundaries
  // =========================================================================
  @Nested
  @DisplayName("MED-02: Undefined Length Sequence & HIPAA PHI Boundaries")
  class Med02SequenceAndPhiTests {

    @Test
    @DisplayName("Undefined Length Sequence followed by PatientName and PatientID: extracts metadata and de-identifies without abort")
    void undefinedLengthSequence_followedByPhi_extractsAndDeidentifies() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // Tag (0008, 1111) SQ with undefined length 0xFFFFFFFF
      writeUndefinedLengthSequence(baos, 0x0008, 0x1111, false);

      // Trailing PHI tags
      String sensitiveName = "Nguyen Thi Kim Ngan";
      String sensitiveMrn = "MRN-TOPSECRET-987654";
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", sensitiveName);
      writeDicomStringElement(baos, 0x0010, 0x0020, "LO", sensitiveMrn);

      // Valid pixel data
      byte[] jpeg = createTestJpeg();
      writeDicomPixelDataHeader(baos, jpeg.length);
      baos.write(jpeg);

      byte[] dicomBytes = baos.toByteArray();

      // 1. extractMetadata must reach past sequence
      DicomMetadata meta = dicomService.extractMetadata(dicomBytes);
      assertThat(meta.patientName()).isEqualTo(sensitiveName);
      assertThat(meta.patientId()).isEqualTo(sensitiveMrn);

      // 2. deidentifyDicom must sanitize sensitiveName and sensitiveMrn
      byte[] anonymized = dicomService.deidentifyDicom(dicomBytes, "ANO-SAFE-001", "MRN-DEID-001");
      DicomMetadata deidMeta = dicomService.extractMetadata(anonymized);
      assertThat(deidMeta.patientName()).isEqualTo("ANO-SAFE-001");
      assertThat(deidMeta.patientId()).isEqualTo("MRN-DEID-001");

      // Verify zero leak in raw output
      String rawDeid = new String(anonymized, StandardCharsets.UTF_8);
      assertThat(rawDeid).doesNotContain(sensitiveName);
      assertThat(rawDeid).doesNotContain(sensitiveMrn);
    }

    @Test
    @DisplayName("Multiple consecutive Undefined Length Sequences before PHI tags: all parsed successfully")
    void multipleConsecutiveSequences_beforePhi_extractsAndDeidentifies() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // 3 consecutive undefined sequences
      writeUndefinedLengthSequence(baos, 0x0008, 0x1111, false);
      writeUndefinedLengthSequence(baos, 0x0008, 0x1120, false);
      writeUndefinedLengthSequence(baos, 0x0008, 0x1140, false);

      String sensitiveName = "Tran Dai Quang";
      String sensitiveMrn = "MRN-CRITICAL-333";
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", sensitiveName);
      writeDicomStringElement(baos, 0x0010, 0x0020, "LO", sensitiveMrn);

      byte[] jpeg = createTestJpeg();
      writeDicomPixelDataHeader(baos, jpeg.length);
      baos.write(jpeg);

      byte[] dicomBytes = baos.toByteArray();

      DicomMetadata meta = dicomService.extractMetadata(dicomBytes);
      assertThat(meta.patientName()).isEqualTo(sensitiveName);
      assertThat(meta.patientId()).isEqualTo(sensitiveMrn);

      byte[] anonymized = dicomService.deidentifyDicom(dicomBytes, "ANO-TRIPLE-SEQ", "MRN-DEID-999");
      String rawDeid = new String(anonymized, StandardCharsets.UTF_8);
      assertThat(rawDeid).doesNotContain(sensitiveName);
      assertThat(rawDeid).doesNotContain(sensitiveMrn);
      assertThat(rawDeid).contains("ANO-TRIPLE-SEQ");
      assertThat(rawDeid).contains("MRN-DEID-999");
    }

    @Test
    @DisplayName("HIPAA PHI Boundary Audit: PatientBirthDate (0010,0030) behavior check")
    void hipaaPhiBoundary_patientBirthDate_auditObservation() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      writeUndefinedLengthSequence(baos, 0x0008, 0x1111, false);

      String sensitiveName = "Hoang Van Thu";
      String sensitiveMrn = "MRN-PHI-888";
      String sensitiveBirthDate = "19650315"; // YYYYMMDD
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", sensitiveName);
      writeDicomStringElement(baos, 0x0010, 0x0020, "LO", sensitiveMrn);
      writeDicomStringElement(baos, 0x0010, 0x0030, "DA", sensitiveBirthDate); // PatientBirthDate

      byte[] jpeg = createTestJpeg();
      writeDicomPixelDataHeader(baos, jpeg.length);
      baos.write(jpeg);

      byte[] dicomBytes = baos.toByteArray();
      byte[] anonymized = dicomService.deidentifyDicom(dicomBytes, "ANO-HOANG", "MRN-DEID-888");

      String rawDeid = new String(anonymized, StandardCharsets.UTF_8);
      // Empirical test: PatientName and PatientID are sanitized
      assertThat(rawDeid).doesNotContain(sensitiveName);
      assertThat(rawDeid).doesNotContain(sensitiveMrn);

      // Verify PatientBirthDate observation:
      // Does deidentifyDicom leave PatientBirthDate untouched?
      boolean birthDatePreserved = rawDeid.contains(sensitiveBirthDate);
      // Note: deidentifyDicom in DicomIngestionService only sanitizes (0010,0010) and (0010,0020)
      assertThat(birthDatePreserved).isTrue();
    }
  }

  // =========================================================================
  // GROUP 3: Nested Undefined Sequences & Depth Tracking Verification
  // =========================================================================
  @Nested
  @DisplayName("Adversarial Test 3: Nested Sequences & Depth Tracking")
  class NestedSequencesDepthTests {

    @Test
    @DisplayName("2-Level Nested Sequence: Outer SQ -> Inner SQ -> Inner Delim -> Outer Delim -> PHI tags")
    void nestedTwoLevelSequence_depthTracking_doesNotExitEarlyAtInnerDelimiter() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // Write 2-level nested sequence
      writeNestedTwoLevelSequence(baos);

      // Trailing PHI tags placed AFTER outer sequence
      String sensitiveName = "Vo Nguyen Giap";
      String sensitiveMrn = "MRN-GENERAL-100";
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", sensitiveName);
      writeDicomStringElement(baos, 0x0010, 0x0020, "LO", sensitiveMrn);

      byte[] jpeg = createTestJpeg();
      writeDicomPixelDataHeader(baos, jpeg.length);
      baos.write(jpeg);

      byte[] dicomBytes = baos.toByteArray();

      // 1. extractMetadata must traverse past nested sequence and reach PHI tags
      DicomMetadata meta = dicomService.extractMetadata(dicomBytes);
      assertThat(meta.patientName()).isEqualTo(sensitiveName);
      assertThat(meta.patientId()).isEqualTo(sensitiveMrn);

      // 2. deidentifyDicom must de-identify trailing tags without early exit at inner delimiter
      byte[] anonymized = dicomService.deidentifyDicom(dicomBytes, "ANO-GENERAL", "MRN-DEID-100");
      DicomMetadata afterMeta = dicomService.extractMetadata(anonymized);
      assertThat(afterMeta.patientName()).isEqualTo("ANO-GENERAL");
      assertThat(afterMeta.patientId()).isEqualTo("MRN-DEID-100");

      String rawDeid = new String(anonymized, StandardCharsets.UTF_8);
      assertThat(rawDeid).doesNotContain(sensitiveName);
      assertThat(rawDeid).doesNotContain(sensitiveMrn);
      assertThat(rawDeid).contains("ANO-GENERAL");
    }

    @Test
    @DisplayName("3-Level Nested Sequence: Outer SQ -> Mid SQ -> Inner SQ -> 3 Delimiters -> PHI tags")
    void nestedThreeLevelSequence_depthTracking_correctlyNavigatesAllDepths() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // Write 3-level nested sequence
      writeNestedThreeLevelSequence(baos);

      String sensitiveName = "Nguyen Hue";
      String sensitiveMrn = "MRN-KING-789";
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", sensitiveName);
      writeDicomStringElement(baos, 0x0010, 0x0020, "LO", sensitiveMrn);

      byte[] jpeg = createTestJpeg();
      writeDicomPixelDataHeader(baos, jpeg.length);
      baos.write(jpeg);

      byte[] dicomBytes = baos.toByteArray();

      DicomMetadata meta = dicomService.extractMetadata(dicomBytes);
      assertThat(meta.patientName()).isEqualTo(sensitiveName);
      assertThat(meta.patientId()).isEqualTo(sensitiveMrn);

      byte[] anonymized = dicomService.deidentifyDicom(dicomBytes, "ANO-KING-HUE", "MRN-DEID-789");
      String rawDeid = new String(anonymized, StandardCharsets.UTF_8);
      assertThat(rawDeid).doesNotContain(sensitiveName);
      assertThat(rawDeid).doesNotContain(sensitiveMrn);
      assertThat(rawDeid).contains("ANO-KING-HUE");
    }

    @Test
    @DisplayName("Malformed Sequence with missing Sequence Delimitation Item: handles gracefully without crashing")
    void malformedSequence_missingDelimiter_fallsBackGracefully() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // Write SQ tag with undefined length 0xFFFFFFFF
      baos.write(0x08);
      baos.write(0x00);
      baos.write(0x11);
      baos.write(0x11);
      baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
      baos.write(0);
      baos.write(0);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);

      // Item tag with undefined length
      baos.write(0xFE);
      baos.write(0xFF);
      baos.write(0x00);
      baos.write(0xE0);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);

      // Random content without FFFE,E0DD delimiter item
      baos.write(new byte[200]);

      byte[] truncatedSeqDicom = baos.toByteArray();

      // deidentifyDicom should not crash (IndexOutOfBoundsException or Infinite loop)
      byte[] output = dicomService.deidentifyDicom(truncatedSeqDicom, "ANO-FALLBACK", "MRN-FALLBACK");
      assertThat(output).isNotEmpty();
    }

    @Test
    @DisplayName("Adversarial Payload: Sequence item containing bytes identical to Sequence Delimiter (FFFE, E0DD)")
    void sequenceItem_containingDelimiterBytesInPayload_behaviorInvestigation() throws IOException {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]);
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // Outer SQ
      baos.write(0x08);
      baos.write(0x00);
      baos.write(0x11);
      baos.write(0x11);
      baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
      baos.write(0);
      baos.write(0);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);

      // Item (FFFE, E000)
      baos.write(0xFE);
      baos.write(0xFF);
      baos.write(0x00);
      baos.write(0xE0);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);
      baos.write(0xFF);

      // Element inside item that has embedded bytes matching (FFFE, E0DD) with length 0
      // Tag (0008, 103E) Series Description
      baos.write(0x08);
      baos.write(0x00);
      baos.write(0x3E);
      baos.write(0x10);
      baos.write("LO".getBytes(StandardCharsets.US_ASCII));
      byte[] payloadWithFakeDelim = new byte[] {
          'A', 'T', 'T', 'A', 'C', 'K',
          (byte) 0xFE, (byte) 0xFF, (byte) 0xDD, (byte) 0xE0, 0, 0, 0, 0,
          'E', 'N', 'D'
      };
      baos.write(payloadWithFakeDelim.length & 0xFF);
      baos.write((payloadWithFakeDelim.length >> 8) & 0xFF);
      baos.write(payloadWithFakeDelim);

      // Genuine Item Delim (FFFE, E00D)
      baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0x0D, (byte) 0xE0, 0, 0, 0, 0});
      // Genuine Seq Delim (FFFE, E0DD)
      baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0xDD, (byte) 0xE0, 0, 0, 0, 0});

      // Sensitive PHI placed after sequence
      String sensitiveName = "Nguyen Van B";
      String sensitiveMrn = "MRN-TRAP-999";
      writeDicomStringElement(baos, 0x0010, 0x0010, "PN", sensitiveName);
      writeDicomStringElement(baos, 0x0010, 0x0020, "LO", sensitiveMrn);

      byte[] jpeg = createTestJpeg();
      writeDicomPixelDataHeader(baos, jpeg.length);
      baos.write(jpeg);

      byte[] dicomBytes = baos.toByteArray();

      // Test what findSequenceEnd and deidentifyDicom do
      byte[] anonymized = dicomService.deidentifyDicom(dicomBytes, "ANO-TRAP-FIX", "MRN-DEID-TRAP");
      String rawDeid = new String(anonymized, StandardCharsets.UTF_8);

      // Empirical verification of adversarial edge case:
      // Because findSequenceEnd uses a byte-by-byte scan rather than element-length-aware parsing,
      // it treats the embedded bytes as a Sequence Delimiter, terminates sequence scanning early,
      // and desyncs tag parsing, leaving sensitiveName unanonymized.
      assertThat(rawDeid)
          .as("Empirically proves that embedded delimiter byte collision causes PHI leak in current linear byte scanner")
          .contains(sensitiveName);
      assertThat(rawDeid)
          .as("Pseudonym was never written due to tag desynchronization")
          .doesNotContain("ANO-TRAP-FIX");
    }
  }

  // =========================================================================
  // HELPER METHODS FOR ADVERSARIAL DICOM GENERATION
  // =========================================================================

  private void writeUndefinedLengthSequence(ByteArrayOutputStream baos, int group, int element, boolean withNestedItem) throws IOException {
    // Group and Element
    baos.write(group & 0xFF);
    baos.write((group >> 8) & 0xFF);
    baos.write(element & 0xFF);
    baos.write((element >> 8) & 0xFF);
    baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
    baos.write(0); // reserved
    baos.write(0);
    // Undefined length: 0xFFFFFFFF
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Item (FFFE, E000) with undefined length
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x00);
    baos.write(0xE0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Inner element
    writeDicomStringElement(baos, 0x0008, 0x0100, "SH", "CODE_VALUE_1");

    // Item Delimitation Item (FFFE, E00D) length 0
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x0D);
    baos.write(0xE0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
    baos.write(0);

    // Sequence Delimitation Item (FFFE, E0DD) length 0
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0xDD);
    baos.write(0xE0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
  }

  private void writeNestedTwoLevelSequence(ByteArrayOutputStream baos) throws IOException {
    // Outer SQ (0008, 1111) Undefined length
    baos.write(0x08);
    baos.write(0x00);
    baos.write(0x11);
    baos.write(0x11);
    baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
    baos.write(0);
    baos.write(0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Outer Item (FFFE, E000) Undefined length
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x00);
    baos.write(0xE0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Inner SQ (0040, A730) Undefined length
    baos.write(0x40);
    baos.write(0x00);
    baos.write(0x30);
    baos.write(0xA7);
    baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
    baos.write(0);
    baos.write(0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Inner Item (FFFE, E000) Undefined length
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x00);
    baos.write(0xE0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Inner item payload (0008, 0104) Code Meaning
    writeDicomStringElement(baos, 0x0008, 0x0104, "LO", "Inner Nested Clinical Meaning");

    // Inner Item Delimitation (FFFE, E00D)
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x0D);
    baos.write(0xE0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
    baos.write(0);

    // Inner Sequence Delimitation (FFFE, E0DD) -- depth decreases from 2 to 1
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0xDD);
    baos.write(0xE0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
    baos.write(0);

    // Outer Item Delimitation (FFFE, E00D)
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x0D);
    baos.write(0xE0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
    baos.write(0);

    // Outer Sequence Delimitation (FFFE, E0DD) -- depth decreases from 1 to 0 (end of sequence)
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0xDD);
    baos.write(0xE0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
    baos.write(0);
  }

  private void writeNestedThreeLevelSequence(ByteArrayOutputStream baos) throws IOException {
    // Level 1 SQ (0008, 1111)
    baos.write(0x08);
    baos.write(0x00);
    baos.write(0x11);
    baos.write(0x11);
    baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
    baos.write(0);
    baos.write(0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Level 1 Item (FFFE, E000)
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x00);
    baos.write(0xE0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Level 2 SQ (0040, A730)
    baos.write(0x40);
    baos.write(0x00);
    baos.write(0x30);
    baos.write(0xA7);
    baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
    baos.write(0);
    baos.write(0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Level 2 Item (FFFE, E000)
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x00);
    baos.write(0xE0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Level 3 SQ (0040, B020)
    baos.write(0x40);
    baos.write(0x00);
    baos.write(0x20);
    baos.write(0xB0);
    baos.write("SQ".getBytes(StandardCharsets.US_ASCII));
    baos.write(0);
    baos.write(0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    // Level 3 Item (FFFE, E000)
    baos.write(0xFE);
    baos.write(0xFF);
    baos.write(0x00);
    baos.write(0xE0);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);
    baos.write(0xFF);

    writeDicomStringElement(baos, 0x0008, 0x0100, "SH", "DEEPEST_CODE");

    // Level 3 Item Delim (FFFE, E00D)
    baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0x0D, (byte) 0xE0, 0, 0, 0, 0});
    // Level 3 Seq Delim (FFFE, E0DD) -- depth from 3 to 2
    baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0xDD, (byte) 0xE0, 0, 0, 0, 0});

    // Level 2 Item Delim (FFFE, E00D)
    baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0x0D, (byte) 0xE0, 0, 0, 0, 0});
    // Level 2 Seq Delim (FFFE, E0DD) -- depth from 2 to 1
    baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0xDD, (byte) 0xE0, 0, 0, 0, 0});

    // Level 1 Item Delim (FFFE, E00D)
    baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0x0D, (byte) 0xE0, 0, 0, 0, 0});
    // Level 1 Seq Delim (FFFE, E0DD) -- depth from 1 to 0
    baos.write(new byte[] {(byte) 0xFE, (byte) 0xFF, (byte) 0xDD, (byte) 0xE0, 0, 0, 0, 0});
  }

  private void writeDicomStringElement(ByteArrayOutputStream baos, int group, int element, String vr, String value) throws IOException {
    byte[] valBytes = value.getBytes(StandardCharsets.UTF_8);
    baos.write(group & 0xFF);
    baos.write((group >> 8) & 0xFF);
    baos.write(element & 0xFF);
    baos.write((element >> 8) & 0xFF);
    baos.write(vr.getBytes(StandardCharsets.US_ASCII));
    baos.write(valBytes.length & 0xFF);
    baos.write((valBytes.length >> 8) & 0xFF);
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
    baos.write(0);
    baos.write(0);
    baos.write(length & 0xFF);
    baos.write((length >> 8) & 0xFF);
    baos.write((length >> 16) & 0xFF);
    baos.write((length >> 24) & 0xFF);
  }

  private static byte[] createTestJpeg() {
    try {
      BufferedImage img = new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB);
      img.setRGB(0, 0, 0xFF0000);
      img.setRGB(1, 1, 0x00FF00);
      img.setRGB(2, 2, 0x0000FF);
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      ImageIO.write(img, "jpg", baos);
      return baos.toByteArray();
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
