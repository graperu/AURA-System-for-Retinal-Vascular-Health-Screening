package com.aura.screening.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.doctor.repository.DoctorPatientAssignmentRepository;
import com.aura.notification.service.UserNotificationService;
import com.aura.screening.dto.CreateScreeningRequest;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import com.aura.system.service.SystemConfigService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScreeningService Dynamic Risk Threshold & Pagination Tests (NFR-3, NFR-16, NFR-23)")
class ScreeningServiceDynamicThresholdTest {

  @Mock private ScreeningRepository screeningRepository;
  @Mock private DoctorPatientAssignmentRepository assignmentRepository;
  @Mock private UserNotificationService notificationService;
  @Mock private com.aura.audit.service.AuditLogService auditLogService;
  @Mock private com.aura.clinic.repository.ClinicMemberRepository clinicMemberRepository;
  @Mock private com.aura.user.repository.UserRepository userRepository;
  @Mock private GeminiRetinalAiService geminiAiService;
  @Mock private SystemConfigService systemConfigService;

  private ScreeningService screeningService;

  private final UUID patientId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    screeningService = new ScreeningService(
        screeningRepository,
        assignmentRepository,
        notificationService,
        auditLogService,
        clinicMemberRepository,
        userRepository,
        geminiAiService,
        null,
        null,
        null,
        systemConfigService
    );
  }

  @Test
  @DisplayName("Dynamic Threshold: Score 76 with critical threshold 75 evaluates to CRITICAL and records AI version")
  void createScreening_customThreshold75_evaluatesToCritical() {
    when(systemConfigService.getCriticalThreshold()).thenReturn(75);
    when(systemConfigService.getHighThreshold()).thenReturn(60);
    when(systemConfigService.getModerateThreshold()).thenReturn(35);
    when(systemConfigService.getActiveModelVersion()).thenReturn("AURA-Gemini-3.7-Pro-v2.5");

    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(Map.of(
        "overallVascularRiskScore", 76,
        "confidence", 0.94,
        "predictions", List.of()
    ));

    when(screeningRepository.save(any(Screening.class))).thenAnswer(invocation -> invocation.getArgument(0));

    CreateScreeningRequest request = new CreateScreeningRequest(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "OD",
        "Fundus",
        "test.png",
        1000L,
        "image/png"
    );

    Screening result = screeningService.createScreening(patientId, request);

    assertThat(result.getAiRiskLevel()).isEqualTo(RiskLevel.CRITICAL);
    assertThat(result.getAiModelVersion()).isEqualTo("AURA-Gemini-3.7-Pro-v2.5");
    assertThat(result.getAppliedThresholds()).isEqualTo("CRIT:75,HIGH:60,MOD:35");
  }

  @Test
  @DisplayName("Dynamic Threshold: Score 62 with high threshold 60 evaluates to HIGH")
  void createScreening_customThreshold60_evaluatesToHigh() {
    when(systemConfigService.getCriticalThreshold()).thenReturn(80);
    when(systemConfigService.getHighThreshold()).thenReturn(60);
    when(systemConfigService.getModerateThreshold()).thenReturn(40);
    when(systemConfigService.getActiveModelVersion()).thenReturn("AURA-Core-v2.4");

    when(geminiAiService.analyzeRetinalVascular(any(), any())).thenReturn(Map.of(
        "overallVascularRiskScore", 62,
        "confidence", 0.91,
        "predictions", List.of()
    ));

    when(screeningRepository.save(any(Screening.class))).thenAnswer(invocation -> invocation.getArgument(0));

    CreateScreeningRequest request = new CreateScreeningRequest(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "OS",
        "Fundus",
        "test2.png",
        1000L,
        "image/png"
    );

    Screening result = screeningService.createScreening(patientId, request);

    assertThat(result.getAiRiskLevel()).isEqualTo(RiskLevel.HIGH);
    assertThat(result.getAiModelVersion()).isEqualTo("AURA-Core-v2.4");
    assertThat(result.getAppliedThresholds()).isEqualTo("CRIT:80,HIGH:60,MOD:40");
  }

  @Test
  @DisplayName("Pagination: getScreeningsForPatient paged delegates to repository with pageable")
  void getScreeningsForPatient_paged_delegatesToRepository() {
    Pageable pageable = PageRequest.of(0, 15);
    Screening s = new Screening(patientId, "test.png");
    Page<Screening> page = new PageImpl<>(List.of(s), pageable, 1);

    when(screeningRepository.findByPatientIdOrderByCreatedAtDesc(eq(patientId), eq(pageable)))
        .thenReturn(page);

    Page<Screening> result = screeningService.getScreeningsForPatient(patientId, pageable);

    assertThat(result).isNotNull();
    assertThat(result.getTotalElements()).isEqualTo(1);
    assertThat(result.getContent()).hasSize(1);
    verify(screeningRepository).findByPatientIdOrderByCreatedAtDesc(eq(patientId), eq(pageable));
  }

  @Test
  @DisplayName("Pagination: getAllScreenings paged delegates to repository with pageable")
  void getAllScreenings_paged_delegatesToRepository() {
    Pageable pageable = PageRequest.of(1, 20);
    Page<Screening> page = new PageImpl<>(List.of(), pageable, 0);

    when(screeningRepository.findAllByOrderByCreatedAtDesc(eq(pageable))).thenReturn(page);

    Page<Screening> result = screeningService.getAllScreenings(pageable);

    assertThat(result).isNotNull();
    verify(screeningRepository).findAllByOrderByCreatedAtDesc(eq(pageable));
  }

  @Test
  @DisplayName("Pagination: getScreeningsForClinic paged delegates to repository with pageable")
  void getScreeningsForClinic_paged_delegatesToRepository() {
    UUID clinicId = UUID.randomUUID();
    Pageable pageable = PageRequest.of(0, 10);
    Page<Screening> page = new PageImpl<>(List.of(), pageable, 0);

    when(screeningRepository.findByClinicIdOrderByCreatedAtDesc(eq(clinicId), eq(pageable))).thenReturn(page);

    Page<Screening> result = screeningService.getScreeningsForClinic(clinicId, pageable);

    assertThat(result).isNotNull();
    verify(screeningRepository).findByClinicIdOrderByCreatedAtDesc(eq(clinicId), eq(pageable));
  }
}
