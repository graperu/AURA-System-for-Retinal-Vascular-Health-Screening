package com.aura.clinic.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.entity.ScreeningStatus;
import com.aura.screening.repository.ScreeningRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClinicAnalyticsService Unit Tests")
class ClinicAnalyticsServiceTest {

  @Mock
  private ScreeningRepository screeningRepository;

  @Mock
  private BulkScreeningBatchRepository bulkBatchRepository;

  private ClinicAnalyticsService analyticsService;
  private final UUID testClinicId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    analyticsService = new ClinicAnalyticsService(screeningRepository, bulkBatchRepository);
  }

  @Nested
  @DisplayName("getCampaignAnalytics Tests")
  class GetCampaignAnalyticsTests {

    @Test
    @DisplayName("Returns aggregated clinic campaign analytics with mocked repository metrics")
    void getCampaignAnalytics_ReturnsAggregatedMetrics() {
      when(bulkBatchRepository.countByClinicId(any(UUID.class))).thenReturn(15L);
      when(screeningRepository.countByClinicId(any(UUID.class))).thenReturn(1250L);
      when(screeningRepository.countByClinicIdAndRiskLevelIn(any(UUID.class), any())).thenReturn(42L);

      Map<String, Object> result = analyticsService.getCampaignAnalytics(testClinicId);

      assertThat(result).isNotNull();
      assertThat(result).containsKeys("totalCampaigns", "totalImages", "highRiskPatients");

      assertThat(result.get("totalCampaigns")).isEqualTo(15L);
      assertThat(result.get("totalImages")).isEqualTo(1250L);
      assertThat(result.get("highRiskPatients")).isEqualTo(42L);
    }

    @Test
    @DisplayName("Returns empty metrics safely when clinicId is null")
    void getCampaignAnalytics_NullClinicId_ReturnsEmptyMetrics() {
      Map<String, Object> result = analyticsService.getCampaignAnalytics(null);

      assertThat(result).isNotNull();
      assertThat(result.get("totalCampaigns")).isEqualTo(0L);
      assertThat(result.get("totalImages")).isEqualTo(0L);
      assertThat(result.get("highRiskPatients")).isEqualTo(0L);
    }

    @Test
    @DisplayName("Handles null repositories safely in no-arg constructor")
    void getCampaignAnalytics_NoArgConstructor_NullSafe() {
      ClinicAnalyticsService noArgService = new ClinicAnalyticsService();
      Map<String, Object> result = noArgService.getCampaignAnalytics(testClinicId);
      assertThat(result).isNotNull();
      assertThat(result.get("totalCampaigns")).isEqualTo(0L);
      assertThat(result.get("totalImages")).isEqualTo(0L);
      assertThat(result.get("highRiskPatients")).isEqualTo(0L);
    }
  }

  @Nested
  @DisplayName("generateExportDataCsv Tests (PII Cleansing & CSV Structure)")
  class GenerateExportDataCsvTests {

    @Test
    @DisplayName("Generates valid CSV with header and data rows")
    void generateExportDataCsv_ValidCsvStructure() {
      UUID screeningId = UUID.randomUUID();
      UUID patientId = UUID.randomUUID();
      Screening s = new Screening(patientId, "http://image.url");
      ReflectionTestUtils.setField(s, "id", screeningId);
      s.setEyePosition("OD");
      s.setScanType("Fundus");
      s.setRiskLevel(RiskLevel.HIGH);
      s.setRiskScore(75);
      s.setStatus(ScreeningStatus.REVIEWED);
      ReflectionTestUtils.setField(s, "createdAt", Instant.parse("2026-09-13T10:00:00Z"));

      when(screeningRepository.findByClinicIdOrderByCreatedAtDesc(any(UUID.class))).thenReturn(List.of(s));

      String csv = analyticsService.generateExportDataCsv(testClinicId);

      assertThat(csv).isNotNull().isNotBlank();

      String[] lines = csv.split("\n");
      assertThat(lines.length).isGreaterThanOrEqualTo(3);

      // Line 0: Medical Disclaimer (MED-03)
      assertThat(lines[0]).isEqualTo("# TUYEN BO MIEN TRU Y TE: Ket qua phan tich do AI thuc hien chi nham muc dich ho tro sang loc va khong thay the chan doan chuyen mon cua bac si chuyen khoa.");

      // Line 1: Header row
      assertThat(lines[1]).isEqualTo("Screening ID,Patient ID,Eye Position,Scan Type,Risk Level,Risk Score,Status,Created At");

      // Line 2: Data row
      assertThat(lines[2]).contains(screeningId.toString());
      assertThat(lines[2]).contains(patientId.toString());
      assertThat(lines[2]).contains("OD,Fundus,HIGH,75,REVIEWED");
    }

    @Test
    @DisplayName("Exported CSV does not leak any Patient Identifiable Information (PII)")
    void generateExportDataCsv_NoPiiLeakage() {
      UUID patientId = UUID.randomUUID();
      Screening s = new Screening(patientId, "http://image.url");
      ReflectionTestUtils.setField(s, "id", UUID.randomUUID());
      s.setEyePosition("OS");
      s.setRiskLevel(RiskLevel.LOW);
      s.setRiskScore(20);
      s.setStatus(ScreeningStatus.ANALYZED);
      ReflectionTestUtils.setField(s, "createdAt", Instant.now());

      when(screeningRepository.findByClinicIdOrderByCreatedAtDesc(any(UUID.class))).thenReturn(List.of(s));

      String csv = analyticsService.generateExportDataCsv(testClinicId);

      // No email addresses
      assertThat(csv).doesNotContain("@");

      // No patient personal name identifiers
      assertThat(csv.toLowerCase()).doesNotContain("patient_name");
      assertThat(csv.toLowerCase()).doesNotContain("mrn");
      assertThat(csv.toLowerCase()).doesNotContain("phone");
      assertThat(csv.toLowerCase()).doesNotContain("cccd");
      assertThat(csv.toLowerCase()).doesNotContain("address");

      // Valid CSV headers
      assertThat(csv).contains("Screening ID,Patient ID");
    }

    @Test
    @DisplayName("Exported CSV handles null repositories and empty list")
    void generateExportDataCsv_NullSafe() {
      ClinicAnalyticsService noArgService = new ClinicAnalyticsService();
      String csv = noArgService.generateExportDataCsv(testClinicId);
      assertThat(csv).isEqualTo(ClinicAnalyticsService.MEDICAL_DISCLAIMER + ClinicAnalyticsService.CSV_HEADER);
    }

    @Test
    @DisplayName("Exported CSV handles null clinicId safely")
    void generateExportDataCsv_NullClinicId() {
      String csv = analyticsService.generateExportDataCsv(null);
      assertThat(csv).isEqualTo(ClinicAnalyticsService.MEDICAL_DISCLAIMER + ClinicAnalyticsService.CSV_HEADER);
    }

    @Test
    @DisplayName("Exported CSV sanitizes CSV formula injection characters (=, +, -, @)")
    void generateExportDataCsv_SanitizesFormulaInjection() {
      UUID screeningId = UUID.randomUUID();
      UUID patientId = UUID.randomUUID();
      Screening s = new Screening(patientId, "http://image.url");
      ReflectionTestUtils.setField(s, "id", screeningId);
      s.setEyePosition("=cmd|'/C calc'!A0");
      s.setScanType("+calc");
      s.setStatus(ScreeningStatus.ANALYZED);

      when(screeningRepository.findByClinicIdOrderByCreatedAtDesc(any(UUID.class))).thenReturn(List.of(s));

      String csv = analyticsService.generateExportDataCsv(testClinicId);
      String[] lines = csv.split("\n");
      assertThat(lines[2]).contains("'=cmd|'/C calc'!A0");
      assertThat(lines[2]).contains("'+calc");
    }
  }
}
