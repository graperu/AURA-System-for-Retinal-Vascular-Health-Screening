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
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClinicAnalyticsService - Optimized CSV Export Null-Safety Unit Tests")
class ClinicAnalyticsServiceOptimizedTest {

  @Mock private ScreeningRepository screeningRepository;
  @Mock private BulkScreeningBatchRepository bulkBatchRepository;

  private ClinicAnalyticsService analyticsService;
  private UUID clinicId;

  @BeforeEach
  void setUp() {
    analyticsService = new ClinicAnalyticsService(screeningRepository, bulkBatchRepository);
    clinicId = UUID.randomUUID();
  }

  @Test
  @DisplayName("generateExportDataCsv: Hoàn toàn an toàn với NullPointer khi TOÀN BỘ các trường tùy chọn đều null")
  void testGenerateExportDataCsvAllNullableFieldsNull() {
    UUID screeningId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();

    Screening s = new Screening(patientId, "http://image.url/scan.png");
    ReflectionTestUtils.setField(s, "id", screeningId);
    s.setEyePosition(null);
    s.setScanType(null);
    s.setRiskLevel(null);
    s.setRiskScore(null);
    s.setStatus(null);
    ReflectionTestUtils.setField(s, "createdAt", null);

    when(screeningRepository.findByClinicIdOrderByCreatedAtDesc(clinicId)).thenReturn(List.of(s));

    String csv = analyticsService.generateExportDataCsv(clinicId);

    assertThat(csv).isNotNull();
    String[] lines = csv.split("\n");
    assertThat(lines).hasSize(3);
    assertThat(lines[0]).isEqualTo("# TUYEN BO MIEN TRU Y TE: Ket qua phan tich do AI thuc hien chi nham muc dich ho tro sang loc va khong thay the chan doan chuyen mon cua bac si chuyen khoa.");
    assertThat(lines[1]).isEqualTo("Screening ID,Patient ID,Eye Position,Scan Type,Risk Level,Risk Score,Status,Created At");

    // Exact expected line: "<screeningId>,<patientId>,,,,0,,"
    String expectedDataRow = screeningId + "," + patientId + ",,,,0,,";
    assertThat(lines[2]).isEqualTo(expectedDataRow);
  }

  @ParameterizedTest(name = "CSV null-safety combination {index}: eye={0}, scanType={1}, riskLevel={2}, riskScore={3}, status={4}")
  @MethodSource("provideScreeningNullCombinations")
  @DisplayName("generateExportDataCsv: Kiểm tra an toàn cho các tổ hợp giá trị null/non-null khác nhau")
  void testGenerateExportDataCsvNullCombinations(
      String eye, String scanType, RiskLevel riskLevel, Integer riskScore, ScreeningStatus status, Instant createdAt,
      String expectedRowSuffix) {

    UUID screeningId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();

    Screening s = new Screening(patientId, "https://cdn.aura.test/eye.jpg");
    ReflectionTestUtils.setField(s, "id", screeningId);
    s.setEyePosition(eye);
    s.setScanType(scanType);
    s.setRiskLevel(riskLevel);
    s.setRiskScore(riskScore);
    s.setStatus(status);
    ReflectionTestUtils.setField(s, "createdAt", createdAt);

    when(screeningRepository.findByClinicIdOrderByCreatedAtDesc(clinicId)).thenReturn(List.of(s));

    String csv = analyticsService.generateExportDataCsv(clinicId);

    String[] lines = csv.split("\n");
    assertThat(lines).hasSize(3);
    assertThat(lines[2]).startsWith(screeningId + "," + patientId + ",");
    assertThat(lines[2]).endsWith(expectedRowSuffix);
  }

  static Stream<Arguments> provideScreeningNullCombinations() {
    Instant testTime = Instant.parse("2026-09-14T08:00:00Z");

    return Stream.of(
        // eye null, rest populated
        Arguments.of(null, "Fundus", RiskLevel.HIGH, 75, ScreeningStatus.REVIEWED, testTime,
            ",Fundus,HIGH,75,REVIEWED," + testTime),
        // riskLevel null, score null -> score defaults to 0
        Arguments.of("OD", null, null, null, ScreeningStatus.ANALYZED, testTime,
            "OD,,,0,ANALYZED," + testTime),
        // status null, createdAt null
        Arguments.of("OS", "OCT", RiskLevel.CRITICAL, 90, null, null,
            "OS,OCT,CRITICAL,90,,"),
        // all populated
        Arguments.of("OD", "Fundus", RiskLevel.LOW, 20, ScreeningStatus.REVIEWED, testTime,
            "OD,Fundus,LOW,20,REVIEWED," + testTime)
    );
  }

  @Test
  @DisplayName("generateExportDataCsv: Khi clinicId null hoặc repository null -> trả về header CSV an toàn kèm disclaimer")
  void testGenerateExportDataCsvNullClinicIdOrNullRepo() {
    // Null clinicId
    String csvNullClinic = analyticsService.generateExportDataCsv(null);
    assertThat(csvNullClinic).isEqualTo(ClinicAnalyticsService.MEDICAL_DISCLAIMER + ClinicAnalyticsService.CSV_HEADER);

    // No-arg constructor (repo is null)
    ClinicAnalyticsService noArgService = new ClinicAnalyticsService();
    String csvNullRepo = noArgService.generateExportDataCsv(clinicId);
    assertThat(csvNullRepo).isEqualTo(ClinicAnalyticsService.MEDICAL_DISCLAIMER + ClinicAnalyticsService.CSV_HEADER);
  }
}
