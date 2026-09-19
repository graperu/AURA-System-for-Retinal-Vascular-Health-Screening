package com.aura.screening.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.aura.auth.security.AuraUserPrincipal;
import com.aura.auth.service.PatientAccessService;
import com.aura.common.response.ApiResponse;
import com.aura.doctor.controller.DoctorPatientController;
import com.aura.doctor.service.DoctorPatientAssignmentService;
import com.aura.patient.repository.PatientProfileRepository;
import com.aura.screening.dto.ScreeningResponse;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.service.ScreeningService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Adversarial Empirical Verification Suite for DAT-04.
 * Stress tests 15MB Base64 payload omission from summary DTOs,
 * memory optimization, and high-performance binary image streaming.
 */
@DisplayName("DAT-04 Adversarial Empirical Stress Test: 15MB Base64 Omission & Binary Streaming")
public class Dat04AdversarialPayloadTest {

  private ScreeningService screeningService;
  private PatientAccessService patientAccessService;
  private ScreeningController screeningController;
  private DoctorPatientController doctorPatientController;
  private PatientProfileRepository patientProfileRepo;
  private DoctorPatientAssignmentService doctorAssignmentService;

  private UUID doctorId;
  private UUID patientId;
  private AuraUserPrincipal doctorPrincipal;
  private AuraUserPrincipal patientPrincipal;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    screeningService = mock(ScreeningService.class);
    patientAccessService = mock(PatientAccessService.class);
    patientProfileRepo = mock(PatientProfileRepository.class);
    doctorAssignmentService = mock(DoctorPatientAssignmentService.class);

    screeningController = new ScreeningController(screeningService, patientAccessService);
    doctorPatientController = new DoctorPatientController(
        doctorAssignmentService,
        null,
        screeningService
    );

    doctorId = UUID.randomUUID();
    patientId = UUID.randomUUID();
    doctorPrincipal = new AuraUserPrincipal(doctorId, "doctor@aura.health", "pass", true, List.of("DOCTOR"));
    patientPrincipal = new AuraUserPrincipal(patientId, "patient@aura.health", "pass", true, List.of("USER"));

    objectMapper = new ObjectMapper()
        .findAndRegisterModules()
        .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
  }

  // =========================================================================
  // 1. 15MB BASE64 PAYLOAD STRESS & SUMMARY OMISSION
  // =========================================================================

  @Test
  @DisplayName("DAT-04 Stress Test: 15MB Base64 image payload is completely omitted from summary DTO, reducing JSON from >20MB to <2.5KB")
  void test15MbBase64OmissionFromSummaryDto() throws Exception {
    // 1. Generate realistic 15MB Base64 image payload (~11.25 MB binary data)
    int binarySize = 11_250_000; // 11.25 MB binary
    byte[] originalBinary = new byte[binarySize];
    Random random = new Random(42);
    random.nextBytes(originalBinary);
    // Set standard JPEG SOI magic bytes (0xFF 0xD8 0xFF 0xE0)
    originalBinary[0] = (byte) 0xFF;
    originalBinary[1] = (byte) 0xD8;
    originalBinary[2] = (byte) 0xFF;
    originalBinary[3] = (byte) 0xE0;

    String base64Content = Base64.getEncoder().encodeToString(originalBinary);
    // Base64 encoding expands 11,250,000 bytes to exactly 15,000,000 characters
    assertThat(base64Content.length()).isEqualTo(15_000_000);

    String dataUrl = "data:image/jpeg;base64," + base64Content;
    assertThat(dataUrl.length()).isGreaterThan(15_000_000);

    // Also generate a 4MB Grad-CAM heatmap base64
    byte[] heatmapBinary = new byte[3_000_000];
    random.nextBytes(heatmapBinary);
    String heatmapDataUrl = "data:image/png;base64," + Base64.getEncoder().encodeToString(heatmapBinary);

    UUID screeningId = UUID.randomUUID();
    Screening screening = new Screening(patientId, dataUrl);
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setDoctorId(doctorId);
    screening.setStatus(ScreeningStatus.ANALYZED);
    screening.setRiskScore(82);
    screening.setRiskLevel(RiskLevel.HIGH);
    screening.setCardiovascularRiskScore(78);
    screening.setCardiovascularRiskLevel("HIGH");
    screening.setHeatmapBase64(heatmapDataUrl);
    screening.setFindings("Severe microaneurysms detected in macula region");
    screening.setRecommendations("Urgent ophthalmic fluorescein angiography referral");
    screening.setEtdrsGrade("Moderate NPDR (Grade 43)");
    screening.setAiModelVersion("Gemini 3.7 Flash High / AURA-Core v2.4");

    // 2. Invoke fromEntitySummary
    ScreeningResponse summary = ScreeningResponse.fromEntitySummary(screening);
    assertNotNull(summary);

    // 3. Assert imageUrl is replaced by lightweight stream URL and heatmapBase64 is null
    String expectedEndpoint = "/api/v1/screenings/" + screeningId + "/image";
    assertEquals(expectedEndpoint, summary.imageUrl());
    assertNull(summary.heatmapBase64(), "Heatmap Base64 must be null in summary response");

    // 4. Assert 0 bytes of the 15MB Base64 text are contained in summary.imageUrl()
    assertThat(summary.imageUrl()).doesNotContain("data:image");
    assertThat(summary.imageUrl()).doesNotContain("base64");
    assertThat(summary.imageUrl()).hasSize(expectedEndpoint.length()); // exactly 58 chars
    assertThat(summary.imageUrl().length()).isLessThan(100);

    // 5. Assert JSON serialization payload size
    String summaryJson = objectMapper.writeValueAsString(summary);
    assertThat(summaryJson.length())
        .as("Serialized summary JSON must be under 2.5KB")
        .isLessThan(2500);
    assertThat(summaryJson)
        .as("Serialized summary JSON must NOT contain any Base64 data substring")
        .doesNotContain(base64Content.substring(0, 100));

    // 6. Contrast with full fromEntity (which includes the 15MB + 4MB Base64 payloads)
    ScreeningResponse full = ScreeningResponse.fromEntity(screening);
    String fullJson = objectMapper.writeValueAsString(full);
    assertThat(fullJson.length())
        .as("Full entity JSON exceeds 19MB")
        .isGreaterThan(19_000_000);

    double compressionRatio = (double) fullJson.length() / summaryJson.length();
    assertThat(compressionRatio)
        .as("Summary payload compression ratio must exceed 7,500x")
        .isGreaterThan(7500.0);
  }

  @Test
  @DisplayName("DAT-04 Batch Stress Test: 25 screenings with 15MB payload serialize into < 50KB total summary JSON (preventing heap exhaustion)")
  void testBatchSummaryHeapMemoryProtection() throws Exception {
    int binarySize = 11_250_000;
    byte[] originalBinary = new byte[binarySize];
    originalBinary[0] = (byte) 0xFF;
    originalBinary[1] = (byte) 0xD8;
    String heavyDataUrl = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(originalBinary);

    List<Screening> batch = new ArrayList<>();
    for (int i = 0; i < 25; i++) {
      UUID sId = UUID.randomUUID();
      Screening s = new Screening(patientId, heavyDataUrl);
      ReflectionTestUtils.setField(s, "id", sId);
      s.setStatus(ScreeningStatus.ANALYZED);
      s.setRiskScore(50 + i);
      s.setRiskLevel(RiskLevel.MODERATE);
      s.setHeatmapBase64("data:image/png;base64,fakeHeatmap" + i);
      batch.add(s);
    }

    // Map using fromEntitySummary (standard for list endpoints)
    List<ScreeningResponse> summaries = batch.stream()
        .map(ScreeningResponse::fromEntitySummary)
        .toList();

    String batchJson = objectMapper.writeValueAsString(summaries);
    assertThat(batchJson.length())
        .as("Total JSON for 25 screenings must be < 50KB instead of > 375MB")
        .isLessThan(50_000);

    for (ScreeningResponse item : summaries) {
      assertThat(item.imageUrl()).startsWith("/api/v1/screenings/");
      assertThat(item.imageUrl()).endsWith("/image");
      assertNull(item.heatmapBase64());
    }
  }

  // =========================================================================
  // 2. BINARY IMAGE STREAMING VIA GET /api/v1/screenings/{id}/image
  // =========================================================================

  @Test
  @DisplayName("DAT-04 Binary Stream: Streams original 11.25MB image bytes with exact binary parity and HTTP caching headers")
  void testStreamOriginalBytesWithValidCachingHeaders() {
    int binarySize = 11_250_000;
    byte[] originalBinary = new byte[binarySize];
    Random random = new Random(12345);
    random.nextBytes(originalBinary);
    originalBinary[0] = (byte) 0xFF;
    originalBinary[1] = (byte) 0xD8;
    originalBinary[2] = (byte) 0xFF;
    originalBinary[3] = (byte) 0xE0;

    String base64 = Base64.getEncoder().encodeToString(originalBinary);
    String dataUrl = "data:image/jpeg;base64," + base64;

    UUID screeningId = UUID.randomUUID();
    Screening screening = new Screening(patientId, dataUrl);
    ReflectionTestUtils.setField(screening, "id", screeningId);

    when(screeningService.getScreeningById(screeningId)).thenReturn(screening);

    // Call GET /api/v1/screenings/{id}/image
    ResponseEntity<?> response = screeningController.getScreeningImage(screeningId, doctorPrincipal);

    // Assert HTTP 200 OK
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

    // Assert Content-Type is image/jpeg
    assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/jpeg");

    // Assert Cache-Control is public, max-age=86400 (1 day)
    String cacheControl = response.getHeaders().getCacheControl();
    assertThat(cacheControl).contains("public");
    assertThat(cacheControl).contains("max-age=86400");

    // Assert response body contains exact original binary bytes
    assertTrue(response.getBody() instanceof byte[], "Response body must be raw byte[]");
    byte[] streamedBytes = (byte[]) response.getBody();
    assertThat(streamedBytes.length).isEqualTo(binarySize);
    assertArrayEquals(originalBinary, streamedBytes, "Streamed binary bytes must match original image bytes with 100% fidelity");
  }

  // =========================================================================
  // 3. ADVERSARIAL EDGE CASES & BOUNDARY CONDITIONS
  // =========================================================================

  @Test
  @DisplayName("DAT-04 Edge Case: Raw Base64 without 'data:' scheme starting with JPEG magic (/9j/) defaults to image/jpeg")
  void testRawBase64WithoutScheme_defaultsToJpeg() {
    byte[] jpegBytes = new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46 };
    String rawBase64 = Base64.getEncoder().encodeToString(jpegBytes);
    assertThat(rawBase64).startsWith("/9j/");

    UUID screeningId = UUID.randomUUID();
    Screening s = new Screening(patientId, rawBase64);
    ReflectionTestUtils.setField(s, "id", screeningId);
    when(screeningService.getScreeningById(screeningId)).thenReturn(s);

    ResponseEntity<?> response = screeningController.getScreeningImage(screeningId, doctorPrincipal);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/jpeg");
    assertArrayEquals(jpegBytes, (byte[]) response.getBody());
  }

  @Test
  @DisplayName("DAT-04 Edge Case: Base64 formatted with RFC 2045 whitespace & line breaks is cleaned and decoded successfully")
  void testBase64WithMimeWhitespaceAndLineBreaks() {
    byte[] testBytes = "RETINAL_FUNDUS_HIGH_RES_BINARY_STREAM_TEST_CONTENT".getBytes(StandardCharsets.UTF_8);
    String rawBase64 = Base64.getEncoder().encodeToString(testBytes);

    // Insert adversarial whitespace, carriage returns, and newlines
    String whitespaceBase64 = "data:image/png;base64,  \r\n" +
        rawBase64.substring(0, 15) + " \r\n  " +
        rawBase64.substring(15, 30) + "\n\t " +
        rawBase64.substring(30) + "  \r\n";

    UUID screeningId = UUID.randomUUID();
    Screening s = new Screening(patientId, whitespaceBase64);
    ReflectionTestUtils.setField(s, "id", screeningId);
    when(screeningService.getScreeningById(screeningId)).thenReturn(s);

    ResponseEntity<?> response = screeningController.getScreeningImage(screeningId, doctorPrincipal);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/png");
    assertArrayEquals(testBytes, (byte[]) response.getBody());
  }

  @Test
  @DisplayName("DAT-04 Edge Case: External CDN / S3 image URLs are preserved in summary and redirected with HTTP 302")
  void testExternalUrlPreservedAndRedirected() {
    String cdnUrl = "https://s3.ap-southeast-1.amazonaws.com/aura-retinal-scans/fundus_hd_9988.jpg";
    UUID screeningId = UUID.randomUUID();
    Screening s = new Screening(patientId, cdnUrl);
    ReflectionTestUtils.setField(s, "id", screeningId);

    // 1. Summary DTO must preserve external URL as-is
    ScreeningResponse summary = ScreeningResponse.fromEntitySummary(s);
    assertEquals(cdnUrl, summary.imageUrl());

    // 2. Binary stream endpoint redirects to external URL
    when(screeningService.getScreeningById(screeningId)).thenReturn(s);
    ResponseEntity<?> response = screeningController.getScreeningImage(screeningId, doctorPrincipal);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FOUND);
    assertThat(response.getHeaders().getLocation().toString()).isEqualTo(cdnUrl);
  }

  @Test
  @DisplayName("DAT-04 Edge Case: Local uploads / assets URLs are preserved in summary DTO")
  void testLocalUploadsUrlPreservedInSummary() {
    String uploadUrl = "/uploads/2026/09/retinal_od_scan.png";
    Screening s = new Screening(patientId, uploadUrl);
    ReflectionTestUtils.setField(s, "id", UUID.randomUUID());

    ScreeningResponse summary = ScreeningResponse.fromEntitySummary(s);
    assertEquals(uploadUrl, summary.imageUrl());
  }

  @Test
  @DisplayName("DAT-04 Edge Case: Missing screening or null/blank imageUrl returns 404 NOT FOUND")
  void testMissingOrBlankImageUrl_returnsNotFound() {
    UUID missingId = UUID.randomUUID();
    when(screeningService.getScreeningById(missingId)).thenReturn(null);
    ResponseEntity<?> res1 = screeningController.getScreeningImage(missingId, doctorPrincipal);
    assertThat(res1.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

    UUID blankId = UUID.randomUUID();
    Screening blankScreening = new Screening(patientId, "   ");
    when(screeningService.getScreeningById(blankId)).thenReturn(blankScreening);
    ResponseEntity<?> res2 = screeningController.getScreeningImage(blankId, doctorPrincipal);
    assertThat(res2.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
  }

  @Test
  @DisplayName("DAT-04 Edge Case: Corrupted Base64 returns 500 without unhandled server crash")
  void testCorruptedBase64_returnsInternalServerError() {
    UUID corruptId = UUID.randomUUID();
    Screening corrupt = new Screening(patientId, "data:image/jpeg;base64,@@@NOT_VALID_BASE64@@@");
    ReflectionTestUtils.setField(corrupt, "id", corruptId);
    when(screeningService.getScreeningById(corruptId)).thenReturn(corrupt);

    ResponseEntity<?> response = screeningController.getScreeningImage(corruptId, doctorPrincipal);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Test
  @DisplayName("DAT-04 Edge Case: Screening with null ID returns null summary imageUrl safely without NullPointerException")
  void testNullScreeningId_safeHandling() {
    Screening s = new Screening(patientId, "data:image/jpeg;base64,/9j/4AAQSkZJRg==");
    ReflectionTestUtils.setField(s, "id", null);

    ScreeningResponse summary = ScreeningResponse.fromEntitySummary(s);
    assertNotNull(summary);
    assertNull(summary.id());
    assertNull(summary.imageUrl());
  }

  // =========================================================================
  // 4. DOCTOR CONTROLLER INTEGRATION VERIFICATION
  // =========================================================================

  @Test
  @DisplayName("DAT-04 Doctor Controller: getScreeningsByPatient uses fromEntitySummary, ensuring 15MB Base64 is omitted from patient review list")
  void testDoctorController_getScreeningsByPatient_omits15MbPayload() {
    UUID screeningId = UUID.randomUUID();
    int binarySize = 11_250_000;
    byte[] bytes = new byte[binarySize];
    bytes[0] = (byte) 0xFF;
    bytes[1] = (byte) 0xD8;
    String heavyBase64 = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);

    Screening screening = new Screening(patientId, heavyBase64);
    ReflectionTestUtils.setField(screening, "id", screeningId);
    screening.setStatus(ScreeningStatus.ANALYZED);
    screening.setRiskScore(70);
    screening.setHeatmapBase64("data:image/png;base64,heavyHeatmap");

    when(patientAccessService.canAccessPatient(doctorPrincipal, patientId)).thenReturn(true);
    when(screeningService.getScreeningsForPatient(patientId)).thenReturn(List.of(screening));

    ApiResponse<List<ScreeningResponse>> apiResponse = doctorPatientController.getAssignedPatientScreenings(patientId);

    assertNotNull(apiResponse);
    List<ScreeningResponse> list = apiResponse.data();
    assertThat(list).hasSize(1);

    ScreeningResponse item = list.get(0);
    assertEquals("/api/v1/screenings/" + screeningId + "/image", item.imageUrl());
    assertNull(item.heatmapBase64());
    assertThat(item.imageUrl().length()).isLessThan(100);
  }
}
