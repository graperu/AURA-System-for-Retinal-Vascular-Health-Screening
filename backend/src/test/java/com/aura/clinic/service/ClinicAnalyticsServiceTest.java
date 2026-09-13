package com.aura.clinic.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("ClinicAnalyticsService Unit Tests")
class ClinicAnalyticsServiceTest {

  private ClinicAnalyticsService analyticsService;

  @BeforeEach
  void setUp() {
    analyticsService = new ClinicAnalyticsService();
  }

  @Nested
  @DisplayName("getCampaignAnalytics Tests")
  class GetCampaignAnalyticsTests {

    @Test
    @DisplayName("Returns aggregated clinic campaign analytics with expected metrics")
    void getCampaignAnalytics_ReturnsAggregatedMetrics() {
      Map<String, Object> result = analyticsService.getCampaignAnalytics();

      assertThat(result).isNotNull();
      assertThat(result).containsKeys("totalCampaigns", "totalImages", "highRiskPatients");

      assertThat(result.get("totalCampaigns")).isEqualTo(15);
      assertThat(result.get("totalImages")).isEqualTo(1250);
      assertThat(result.get("highRiskPatients")).isEqualTo(42);
    }
  }

  @Nested
  @DisplayName("generateExportDataCsv Tests (PII Cleansing & CSV Structure)")
  class GenerateExportDataCsvTests {

    @Test
    @DisplayName("Generates valid CSV with header and data rows")
    void generateExportDataCsv_ValidCsvStructure() {
      String csv = analyticsService.generateExportDataCsv();

      assertThat(csv).isNotNull().isNotBlank();

      String[] lines = csv.split("\n");
      assertThat(lines.length).isGreaterThanOrEqualTo(3);

      // Header row
      assertThat(lines[0]).isEqualTo("Campaign ID,Date,Images,High Risk");

      // Row 1
      String[] row1 = lines[1].split(",");
      assertThat(row1).hasSize(4);
      assertThat(row1[0]).isEqualTo("CAMP-001");
      assertThat(row1[1]).matches("^\\d{4}-\\d{2}-\\d{2}$");
      assertThat(Integer.parseInt(row1[2])).isPositive();
      assertThat(Integer.parseInt(row1[3])).isNotNegative();

      // Row 2
      String[] row2 = lines[2].split(",");
      assertThat(row2).hasSize(4);
      assertThat(row2[0]).isEqualTo("CAMP-002");
      assertThat(row2[1]).matches("^\\d{4}-\\d{2}-\\d{2}$");
      assertThat(Integer.parseInt(row2[2])).isPositive();
      assertThat(Integer.parseInt(row2[3])).isNotNegative();
    }

    @Test
    @DisplayName("Exported CSV does not leak any Patient Identifiable Information (PII)")
    void generateExportDataCsv_NoPiiLeakage() {
      String csv = analyticsService.generateExportDataCsv();

      // No email addresses
      assertThat(csv).doesNotContain("@");

      // No patient personal name identifiers
      assertThat(csv.toLowerCase()).doesNotContain("patient_name");
      assertThat(csv.toLowerCase()).doesNotContain("mrn");
      assertThat(csv.toLowerCase()).doesNotContain("phone");
      assertThat(csv.toLowerCase()).doesNotContain("cccd");
      assertThat(csv.toLowerCase()).doesNotContain("address");

      // Only aggregated metrics
      assertThat(csv).contains("Campaign ID");
      assertThat(csv).contains("Images");
      assertThat(csv).contains("High Risk");
    }

    @Test
    @DisplayName("Exported CSV is valid UTF-8 and idempotent")
    void generateExportDataCsv_Utf8AndIdempotent() {
      String csv1 = analyticsService.generateExportDataCsv();
      String csv2 = analyticsService.generateExportDataCsv();

      assertThat(csv1).isEqualTo(csv2);
      byte[] bytes = csv1.getBytes(StandardCharsets.UTF_8);
      assertThat(new String(bytes, StandardCharsets.UTF_8)).isEqualTo(csv1);
    }
  }
}
