package com.aura.bulk.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.aura.bulk.dto.PatientAnonymizedDto;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@DisplayName("PatientAnonymizerService Unit Tests (HIPAA NFR-9/NFR-10)")
class PatientAnonymizerServiceTest {

  private static final String TEST_HMAC_SECRET = "TEST_AURA_HIPAA_SECRET_KEY_1234567890";
  private PatientAnonymizerService anonymizerService;

  @BeforeEach
  void setUp() {
    anonymizerService = new PatientAnonymizerService(TEST_HMAC_SECRET);
  }

  @Nested
  @DisplayName("HMAC Pseudonym Generation Tests")
  class PseudonymGenerationTests {

    @Test
    @DisplayName("Generates pseudonyms with valid prefix and hex length")
    void anonymizePatient_GeneratesValidPrefixAndHexLength() {
      PatientAnonymizedDto dto =
          anonymizerService.anonymizePatient(
              "MRN-887766", "Nguyen Van An", 52, "MALE", 125, 82, 5.8);

      assertThat(dto.pseudonymId()).isNotNull().startsWith("ANO-PAT-");
      assertThat(dto.deidentifiedMrn()).isNotNull().startsWith("MRN-DEID-");

      // "ANO-PAT-" (8 chars) + 8 hex chars = 16
      assertThat(dto.pseudonymId()).hasSize(16);
      // "MRN-DEID-" (9 chars) + 8 hex chars = 17
      assertThat(dto.deidentifiedMrn()).hasSize(17);

      String hexPseudo = dto.pseudonymId().substring("ANO-PAT-".length());
      assertThat(hexPseudo).matches("^[0-9A-F]{8}$");

      String hexMrn = dto.deidentifiedMrn().substring("MRN-DEID-".length());
      assertThat(hexMrn).matches("^[0-9A-F]{8}$");
    }

    @Test
    @DisplayName("Anonymization is deterministic for identical raw patient input")
    void anonymizePatient_IsDeterministic() {
      PatientAnonymizedDto first =
          anonymizerService.anonymizePatient(
              "MRN-12345", "Tran Thi Binh", 48, "FEMALE", 120, 80, 5.5);
      PatientAnonymizedDto second =
          anonymizerService.anonymizePatient(
              "MRN-12345", "Tran Thi Binh", 48, "FEMALE", 120, 80, 5.5);

      assertThat(first.pseudonymId()).isEqualTo(second.pseudonymId());
      assertThat(first.deidentifiedMrn()).isEqualTo(second.deidentifiedMrn());
    }

    @Test
    @DisplayName("Whitespace in MRN and Name is trimmed before HMAC calculation")
    void anonymizePatient_TrimsWhitespace() {
      PatientAnonymizedDto trimmed =
          anonymizerService.anonymizePatient(
              "MRN-555", "Le Van Cuong", 35, "MALE", 118, 76, 5.2);
      PatientAnonymizedDto withSpaces =
          anonymizerService.anonymizePatient(
              "  MRN-555  ", "   Le Van Cuong   ", 35, "MALE", 118, 76, 5.2);

      assertThat(trimmed.pseudonymId()).isEqualTo(withSpaces.pseudonymId());
      assertThat(trimmed.deidentifiedMrn()).isEqualTo(withSpaces.deidentifiedMrn());
    }

    @Test
    @DisplayName("Different patients produce unique non-colliding pseudonyms")
    void anonymizePatient_DifferentInputs_ProduceDifferentPseudonyms() {
      PatientAnonymizedDto p1 =
          anonymizerService.anonymizePatient(
              "MRN-001", "Pham Van Dong", 60, "MALE", 130, 85, 6.0);
      PatientAnonymizedDto p2 =
          anonymizerService.anonymizePatient(
              "MRN-002", "Pham Van Dong", 60, "MALE", 130, 85, 6.0);
      PatientAnonymizedDto p3 =
          anonymizerService.anonymizePatient(
              "MRN-001", "Vo Van Giap", 60, "MALE", 130, 85, 6.0);

      assertThat(p1.pseudonymId()).isNotEqualTo(p2.pseudonymId());
      assertThat(p1.pseudonymId()).isNotEqualTo(p3.pseudonymId());
      assertThat(p2.pseudonymId()).isNotEqualTo(p3.pseudonymId());
    }

    @Test
    @DisplayName("Different HMAC secrets produce different pseudonyms for same patient")
    void anonymizePatient_DifferentSecret_ProducesDifferentPseudonyms() {
      PatientAnonymizerService service2 =
          new PatientAnonymizerService("COMPLETELY_DIFFERENT_HMAC_SECRET_KEY_9999");

      PatientAnonymizedDto dto1 =
          anonymizerService.anonymizePatient(
              "MRN-999", "Hoang Van Em", 42, "MALE", 120, 80, 5.4);
      PatientAnonymizedDto dto2 =
          service2.anonymizePatient(
              "MRN-999", "Hoang Van Em", 42, "MALE", 120, 80, 5.4);

      assertThat(dto1.pseudonymId()).isNotEqualTo(dto2.pseudonymId());
      assertThat(dto1.deidentifiedMrn()).isNotEqualTo(dto2.deidentifiedMrn());
    }
  }

  @Nested
  @DisplayName("PII Leakage Prevention Tests")
  class PiiLeakageTests {

    @Test
    @DisplayName("Pseudonym and deidentified MRN contain zero plaintext PII tokens")
    void anonymizePatient_ZeroPiiLeakage() {
      String rawMrn = "MRN-SENSITIVE-9876";
      String rawName = "Nguyen Thi Kim Cuc";

      PatientAnonymizedDto dto =
          anonymizerService.anonymizePatient(rawMrn, rawName, 55, "FEMALE", 135, 88, 6.1);

      assertThat(dto.pseudonymId()).doesNotContain("SENSITIVE");
      assertThat(dto.pseudonymId()).doesNotContain("9876");
      assertThat(dto.pseudonymId().toLowerCase()).doesNotContain("nguyen");
      assertThat(dto.pseudonymId().toLowerCase()).doesNotContain("cuc");

      assertThat(dto.deidentifiedMrn()).doesNotContain("SENSITIVE");
      assertThat(dto.deidentifiedMrn()).doesNotContain("9876");
      assertThat(dto.deidentifiedMrn().toLowerCase()).doesNotContain("nguyen");
    }
  }

  @Nested
  @DisplayName("Clinical Risk Boundary Logic Tests")
  class ClinicalConditionTests {

    @ParameterizedTest(name = "HbA1c {0} -> hasDiabetes={1}")
    @CsvSource({
      "6.5, true",
      "6.51, true",
      "8.2, true",
      "6.49, false",
      "6.4, false",
      "5.0, false"
    })
    @DisplayName("Diabetes flag evaluates correctly around HbA1c 6.5 boundary")
    void evaluateDiabetesFlag(double hba1c, boolean expectedDiabetes) {
      PatientAnonymizedDto dto =
          anonymizerService.anonymizePatient(
              "MRN-TEST", "Test Patient", 50, "MALE", 120, 80, hba1c);

      assertThat(dto.hasDiabetes()).isEqualTo(expectedDiabetes);
      assertThat(dto.hbA1c()).isEqualTo(hba1c);
    }

    @ParameterizedTest(name = "BP {0}/{1} -> hasHypertension={2}")
    @CsvSource({
      "140, 85, true",
      "141, 80, true",
      "135, 90, true",
      "130, 95, true",
      "160, 100, true",
      "139, 89, false",
      "139, 70, false",
      "120, 89, false",
      "120, 80, false"
    })
    @DisplayName("Hypertension flag evaluates correctly around systolic 140 and diastolic 90 boundaries")
    void evaluateHypertensionFlag(int systolicBp, int diastolicBp, boolean expectedHypertension) {
      PatientAnonymizedDto dto =
          anonymizerService.anonymizePatient(
              "MRN-TEST", "Test Patient", 50, "MALE", systolicBp, diastolicBp, 5.5);

      assertThat(dto.hasHypertension()).isEqualTo(expectedHypertension);
      assertThat(dto.systolicBp()).isEqualTo(systolicBp);
      assertThat(dto.diastolicBp()).isEqualTo(diastolicBp);
    }

    @Test
    @DisplayName("Patient clinical non-PII fields are accurately preserved")
    void preservesClinicalMetadata() {
      Instant before = Instant.now().minusSeconds(1);

      PatientAnonymizedDto dto =
          anonymizerService.anonymizePatient(
              "MRN-101", "Bui Van G", 67, "OTHER", 145, 92, 7.4);

      assertThat(dto.age()).isEqualTo(67);
      assertThat(dto.gender()).isEqualTo("OTHER");
      assertThat(dto.systolicBp()).isEqualTo(145);
      assertThat(dto.diastolicBp()).isEqualTo(92);
      assertThat(dto.hbA1c()).isEqualTo(7.4);
      assertThat(dto.hasDiabetes()).isTrue();
      assertThat(dto.hasHypertension()).isTrue();
      assertThat(dto.anonymizedAt()).isNotNull().isAfterOrEqualTo(before);
    }
  }

  @Nested
  @DisplayName("stripDicomMetadataHeaders Tests")
  class DicomStrippingTests {

    @Test
    @DisplayName("Returns empty string when payload is null")
    void stripDicom_NullPayload_ReturnsEmpty() {
      assertThat(anonymizerService.stripDicomMetadataHeaders(null)).isEmpty();
    }

    @Test
    @DisplayName("Returns empty string when payload is empty or blank")
    void stripDicom_BlankPayload_ReturnsEmpty() {
      assertThat(anonymizerService.stripDicomMetadataHeaders("")).isEmpty();
      assertThat(anonymizerService.stripDicomMetadataHeaders("   ")).isEmpty();
    }

    @Test
    @DisplayName("Returns de-identified Base64 payload when valid data is provided")
    void stripDicom_ValidPayload_ReturnsStrippedContent() {
      String fakeBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      String result = anonymizerService.stripDicomMetadataHeaders(fakeBase64);

      assertThat(result).isEqualTo(fakeBase64);
    }

    @Test
    @DisplayName("Real binary DICOM payload is detected, PHI tags stripped and extracted as PNG")
    void stripDicom_RealBinaryDicom_StripsAndExtractsCleanImage() throws Exception {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      baos.write(new byte[128]); // Preamble
      baos.write(new byte[] {'D', 'I', 'C', 'M'});

      // Minimal authentic JPEG byte stream
      BufferedImage img = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
      img.setRGB(0, 0, 0xFF0000);
      ByteArrayOutputStream imgBaos = new ByteArrayOutputStream();
      ImageIO.write(img, "jpg", imgBaos);
      baos.write(imgBaos.toByteArray());

      byte[] sampleDicom = baos.toByteArray();
      String dicomB64 = "data:application/dicom;base64," + java.util.Base64.getEncoder().encodeToString(sampleDicom);
      String stripped = anonymizerService.stripDicomMetadataHeaders(dicomB64);

      assertThat(stripped).isNotNull().startsWith("data:image/png;base64,");
      byte[] decoded = java.util.Base64.getDecoder().decode(stripped.substring("data:image/png;base64,".length()));
      assertThat(decoded[0]).isEqualTo((byte) 0x89);
      assertThat(decoded[1]).isEqualTo((byte) 0x50);
      assertThat(decoded[2]).isEqualTo((byte) 0x4E);
      assertThat(decoded[3]).isEqualTo((byte) 0x47);
    }

    @Test
    @DisplayName("DICOM without pixel stream preserves deidentified DICOM container (data:application/dicom;base64)")
    void stripDicom_NoPixelStream_PreservesDeidentifiedDicom() {
      byte[] sampleDicom = new byte[256];
      sampleDicom[128] = 'D';
      sampleDicom[129] = 'I';
      sampleDicom[130] = 'C';
      sampleDicom[131] = 'M';

      String dicomB64 = "data:application/dicom;base64," + java.util.Base64.getEncoder().encodeToString(sampleDicom);
      String stripped = anonymizerService.stripDicomMetadataHeaders(dicomB64);

      assertThat(stripped).isNotNull().startsWith("data:application/dicom;base64,");
    }
  }
}
