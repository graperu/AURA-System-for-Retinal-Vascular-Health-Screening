package com.aura.system.service;

import com.aura.admin.dto.AiConfigDto;
import com.aura.system.entity.SystemConfig;
import com.aura.system.repository.SystemConfigRepository;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing dynamic system and AI risk thresholds with runtime in-memory caching (NFR-16, NFR-23).
 * When administrators update configuration, the cache is evicted immediately without downtime.
 */
@Service
public class SystemConfigService {

  private static final Logger log = LoggerFactory.getLogger(SystemConfigService.class);

  public static final String KEY_CRITICAL_THRESHOLD = "ai.risk.critical_threshold";
  public static final String KEY_HIGH_THRESHOLD = "ai.risk.high_threshold";
  public static final String KEY_MODERATE_THRESHOLD = "ai.risk.moderate_threshold";
  public static final String KEY_MODEL_VERSION = "ai.model.active_version";
  public static final String KEY_BRIER_SCORE = "ai.calibration.brier_score";
  public static final String KEY_CALIBRATION_METHOD = "ai.calibration.method";
  public static final String KEY_SENSITIVITY = "ai.sensitivity.threshold";
  public static final String KEY_CONFIDENCE = "ai.confidence.threshold";
  public static final String KEY_AVR_WARNING = "ai.avr.warning_threshold";
  public static final String KEY_AUTO_RETRAIN = "ai.auto_retrain.enabled";

  public static final int DEFAULT_CRITICAL_THRESHOLD = 80;
  public static final int DEFAULT_HIGH_THRESHOLD = 65;
  public static final int DEFAULT_MODERATE_THRESHOLD = 40;
  public static final String DEFAULT_MODEL_VERSION = "Gemini 3.7 Flash High / AURA-Core v2.4";
  public static final double DEFAULT_BRIER_SCORE = 0.058;
  public static final String DEFAULT_CALIBRATION_METHOD = "Platt-Scaling";
  public static final double DEFAULT_SENSITIVITY = 0.85;
  public static final double DEFAULT_CONFIDENCE = 0.90;
  public static final double DEFAULT_AVR_WARNING = 0.65;
  public static final boolean DEFAULT_AUTO_RETRAIN = true;

  private final SystemConfigRepository configRepository;

  public SystemConfigService(SystemConfigRepository configRepository) {
    this.configRepository = configRepository;
  }

  @Cacheable(value = "systemConfig", key = "'aiConfig'")
  @Transactional(readOnly = true)
  public AiConfigDto getAiConfig() {
    log.debug("Fetching AI system configuration from database (cache miss)");

    String modelVersion = getStringConfig(KEY_MODEL_VERSION, DEFAULT_MODEL_VERSION);
    int critical = getIntConfig(KEY_CRITICAL_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD);
    int high = getIntConfig(KEY_HIGH_THRESHOLD, DEFAULT_HIGH_THRESHOLD);
    int moderate = getIntConfig(KEY_MODERATE_THRESHOLD, DEFAULT_MODERATE_THRESHOLD);
    double brierScore = getDoubleConfig(KEY_BRIER_SCORE, DEFAULT_BRIER_SCORE);
    String calibrationMethod = getStringConfig(KEY_CALIBRATION_METHOD, DEFAULT_CALIBRATION_METHOD);
    Double sensitivity = getDoubleConfig(KEY_SENSITIVITY, DEFAULT_SENSITIVITY);
    Double confidence = getDoubleConfig(KEY_CONFIDENCE, DEFAULT_CONFIDENCE);
    Double avrWarning = getDoubleConfig(KEY_AVR_WARNING, DEFAULT_AVR_WARNING);
    Boolean autoRetrain = getBooleanConfig(KEY_AUTO_RETRAIN, DEFAULT_AUTO_RETRAIN);

    String lastUpdated = Instant.now().toString();
    try {
      Optional<SystemConfig> latest = configRepository.findByConfigKey(KEY_MODEL_VERSION);
      if (latest.isPresent() && latest.get().getUpdatedAt() != null) {
        lastUpdated = latest.get().getUpdatedAt().toString();
      }
    } catch (Exception e) {
      log.warn("Could not determine lastUpdated timestamp from database: {}", e.getMessage());
    }

    return new AiConfigDto(
        modelVersion,
        sensitivity,
        confidence,
        avrWarning,
        autoRetrain,
        lastUpdated,
        critical,
        high,
        moderate,
        brierScore,
        calibrationMethod
    );
  }

  @CacheEvict(value = "systemConfig", allEntries = true)
  @Transactional
  public AiConfigDto updateAiConfig(AiConfigDto update, String updatedBy) {
    String operator = (updatedBy != null && !updatedBy.isBlank()) ? updatedBy : "ADMIN";
    log.info("Updating AI system configuration by operator: {}", operator);

    if (update.activeModelVersion() != null) {
      saveOrUpdate(KEY_MODEL_VERSION, update.activeModelVersion().trim(), "Phiên bản mô hình AI hoạt động", operator);
    }
    if (update.criticalThreshold() != null) {
      saveOrUpdate(KEY_CRITICAL_THRESHOLD, String.valueOf(update.criticalThreshold()), "Ngưỡng nguy cơ rất cao (Critical)", operator);
    }
    if (update.highThreshold() != null) {
      saveOrUpdate(KEY_HIGH_THRESHOLD, String.valueOf(update.highThreshold()), "Ngưỡng nguy cơ cao (High)", operator);
    }
    if (update.moderateThreshold() != null) {
      saveOrUpdate(KEY_MODERATE_THRESHOLD, String.valueOf(update.moderateThreshold()), "Ngưỡng nguy cơ trung bình (Moderate)", operator);
    }
    if (update.brierScore() != null) {
      saveOrUpdate(KEY_BRIER_SCORE, String.valueOf(update.brierScore()), "Chỉ số Brier score hiệu chuẩn", operator);
    }
    if (update.calibrationMethod() != null) {
      saveOrUpdate(KEY_CALIBRATION_METHOD, update.calibrationMethod().trim(), "Phương pháp hiệu chuẩn", operator);
    }
    if (update.sensitivityThreshold() != null) {
      saveOrUpdate(KEY_SENSITIVITY, String.valueOf(update.sensitivityThreshold()), "Ngưỡng độ nhạy phát hiện vi mạch", operator);
    }
    if (update.confidenceThreshold() != null) {
      saveOrUpdate(KEY_CONFIDENCE, String.valueOf(update.confidenceThreshold()), "Ngưỡng độ tự tin tối thiểu", operator);
    }
    if (update.avrWarningThreshold() != null) {
      saveOrUpdate(KEY_AVR_WARNING, String.valueOf(update.avrWarningThreshold()), "Ngưỡng cảnh báo tỷ lệ động tĩnh mạch AVR", operator);
    }
    if (update.autoRetrainEnabled() != null) {
      saveOrUpdate(KEY_AUTO_RETRAIN, String.valueOf(update.autoRetrainEnabled()), "Chính sách tự động tái huấn luyện", operator);
    }

    return getAiConfig();
  }

  public int getCriticalThreshold() {
    return getAiConfig().criticalThreshold() != null ? getAiConfig().criticalThreshold() : DEFAULT_CRITICAL_THRESHOLD;
  }

  public int getHighThreshold() {
    return getAiConfig().highThreshold() != null ? getAiConfig().highThreshold() : DEFAULT_HIGH_THRESHOLD;
  }

  public int getModerateThreshold() {
    return getAiConfig().moderateThreshold() != null ? getAiConfig().moderateThreshold() : DEFAULT_MODERATE_THRESHOLD;
  }

  public String getActiveModelVersion() {
    return getAiConfig().activeModelVersion() != null ? getAiConfig().activeModelVersion() : DEFAULT_MODEL_VERSION;
  }

  public double getBrierScore() {
    return getAiConfig().brierScore() != null ? getAiConfig().brierScore() : DEFAULT_BRIER_SCORE;
  }

  public String getCalibrationMethod() {
    return getAiConfig().calibrationMethod() != null ? getAiConfig().calibrationMethod() : DEFAULT_CALIBRATION_METHOD;
  }

  private void saveOrUpdate(String key, String value, String description, String updatedBy) {
    try {
      SystemConfig entity = configRepository.findByConfigKey(key)
          .orElseGet(() -> new SystemConfig(key, value, description, updatedBy));
      entity.setConfigValue(value);
      entity.setDescription(description);
      entity.setUpdatedAt(Instant.now());
      entity.setUpdatedBy(updatedBy);
      configRepository.save(entity);
    } catch (Exception e) {
      log.error("Failed to persist system configuration for key {}: {}", key, e.getMessage());
    }
  }

  private String getStringConfig(String key, String defaultValue) {
    try {
      return configRepository.findByConfigKey(key)
          .map(SystemConfig::getConfigValue)
          .orElse(defaultValue);
    } catch (Exception e) {
      return defaultValue;
    }
  }

  private int getIntConfig(String key, int defaultValue) {
    try {
      return configRepository.findByConfigKey(key)
          .map(c -> Integer.parseInt(c.getConfigValue().trim()))
          .orElse(defaultValue);
    } catch (Exception e) {
      return defaultValue;
    }
  }

  private double getDoubleConfig(String key, double defaultValue) {
    try {
      return configRepository.findByConfigKey(key)
          .map(c -> Double.parseDouble(c.getConfigValue().trim()))
          .orElse(defaultValue);
    } catch (Exception e) {
      return defaultValue;
    }
  }

  private boolean getBooleanConfig(String key, boolean defaultValue) {
    try {
      return configRepository.findByConfigKey(key)
          .map(c -> Boolean.parseBoolean(c.getConfigValue().trim()))
          .orElse(defaultValue);
    } catch (Exception e) {
      return defaultValue;
    }
  }
}
