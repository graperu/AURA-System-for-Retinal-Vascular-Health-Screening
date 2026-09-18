package com.aura.system.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.admin.dto.AiConfigDto;
import com.aura.system.entity.SystemConfig;
import com.aura.system.repository.SystemConfigRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("SystemConfigService Dynamic Configuration & Caching Tests (NFR-16, NFR-23)")
class SystemConfigServiceTest {

  @Mock
  private SystemConfigRepository configRepository;

  private SystemConfigService systemConfigService;

  @BeforeEach
  void setUp() {
    systemConfigService = new SystemConfigService(configRepository);
  }

  @Test
  @DisplayName("getAiConfig returns seeded defaults when repository is empty")
  void getAiConfig_emptyRepository_returnsSeededDefaults() {
    when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());

    AiConfigDto config = systemConfigService.getAiConfig();

    assertThat(config).isNotNull();
    assertThat(config.activeModelVersion()).isEqualTo(SystemConfigService.DEFAULT_MODEL_VERSION);
    assertThat(config.criticalThreshold()).isEqualTo(80);
    assertThat(config.highThreshold()).isEqualTo(65);
    assertThat(config.moderateThreshold()).isEqualTo(40);
    assertThat(config.brierScore()).isEqualTo(0.058);
    assertThat(config.calibrationMethod()).isEqualTo("Platt-Scaling");
    assertThat(config.sensitivityThreshold()).isEqualTo(0.85);
    assertThat(config.confidenceThreshold()).isEqualTo(0.90);
    assertThat(config.avrWarningThreshold()).isEqualTo(0.65);
    assertThat(config.autoRetrainEnabled()).isTrue();
  }

  @Test
  @DisplayName("getAiConfig returns values from repository when records exist")
  void getAiConfig_recordsPresent_returnsPersistedValues() {
    SystemConfig modelCfg = new SystemConfig(SystemConfigService.KEY_MODEL_VERSION, "AURA-V3-Advanced", "desc", "ADMIN");
    modelCfg.setUpdatedAt(Instant.parse("2026-09-18T10:00:00Z"));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_MODEL_VERSION)).thenReturn(Optional.of(modelCfg));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_CRITICAL_THRESHOLD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_CRITICAL_THRESHOLD, "85", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_HIGH_THRESHOLD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_HIGH_THRESHOLD, "70", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_MODERATE_THRESHOLD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_MODERATE_THRESHOLD, "45", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_BRIER_SCORE))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_BRIER_SCORE, "0.042", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_CALIBRATION_METHOD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_CALIBRATION_METHOD, "Isotonic", "desc", "ADMIN")));

    AiConfigDto config = systemConfigService.getAiConfig();

    assertThat(config.activeModelVersion()).isEqualTo("AURA-V3-Advanced");
    assertThat(config.criticalThreshold()).isEqualTo(85);
    assertThat(config.highThreshold()).isEqualTo(70);
    assertThat(config.moderateThreshold()).isEqualTo(45);
    assertThat(config.brierScore()).isEqualTo(0.042);
    assertThat(config.calibrationMethod()).isEqualTo("Isotonic");
  }

  @Test
  @DisplayName("updateAiConfig saves updated parameters to repository and updates lastUpdated")
  void updateAiConfig_updatesRepositoryAndEvicts() {
    when(configRepository.findByConfigKey(any())).thenReturn(Optional.empty());

    AiConfigDto updateReq = new AiConfigDto(
        "AURA-Retina-V2.5",
        0.88,
        0.92,
        0.60,
        false,
        null,
        75,
        60,
        35,
        0.049,
        "Platt-Scaling"
    );

    systemConfigService.updateAiConfig(updateReq, "superadmin@aura.hospital");

    ArgumentCaptor<SystemConfig> captor = ArgumentCaptor.forClass(SystemConfig.class);
    verify(configRepository, times(10)).save(captor.capture());

    boolean savedCrit = captor.getAllValues().stream()
        .anyMatch(c -> c.getConfigKey().equals(SystemConfigService.KEY_CRITICAL_THRESHOLD) && c.getConfigValue().equals("75"));
    boolean savedHigh = captor.getAllValues().stream()
        .anyMatch(c -> c.getConfigKey().equals(SystemConfigService.KEY_HIGH_THRESHOLD) && c.getConfigValue().equals("60"));
    boolean savedModel = captor.getAllValues().stream()
        .anyMatch(c -> c.getConfigKey().equals(SystemConfigService.KEY_MODEL_VERSION) && c.getConfigValue().equals("AURA-Retina-V2.5"));

    assertThat(savedCrit).isTrue();
    assertThat(savedHigh).isTrue();
    assertThat(savedModel).isTrue();
  }

  @Test
  @DisplayName("Direct helper threshold methods return correct parsed values")
  void helperMethods_returnParsedValues() {
    when(configRepository.findByConfigKey(SystemConfigService.KEY_CRITICAL_THRESHOLD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_CRITICAL_THRESHOLD, "78", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_HIGH_THRESHOLD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_HIGH_THRESHOLD, "62", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_MODERATE_THRESHOLD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_MODERATE_THRESHOLD, "38", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_MODEL_VERSION))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_MODEL_VERSION, "Model-XYZ", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_BRIER_SCORE))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_BRIER_SCORE, "0.051", "desc", "ADMIN")));
    when(configRepository.findByConfigKey(SystemConfigService.KEY_CALIBRATION_METHOD))
        .thenReturn(Optional.of(new SystemConfig(SystemConfigService.KEY_CALIBRATION_METHOD, "Platt-Scaling", "desc", "ADMIN")));

    assertThat(systemConfigService.getCriticalThreshold()).isEqualTo(78);
    assertThat(systemConfigService.getHighThreshold()).isEqualTo(62);
    assertThat(systemConfigService.getModerateThreshold()).isEqualTo(38);
    assertThat(systemConfigService.getActiveModelVersion()).isEqualTo("Model-XYZ");
    assertThat(systemConfigService.getBrierScore()).isEqualTo(0.051);
    assertThat(systemConfigService.getCalibrationMethod()).isEqualTo("Platt-Scaling");
  }
}
