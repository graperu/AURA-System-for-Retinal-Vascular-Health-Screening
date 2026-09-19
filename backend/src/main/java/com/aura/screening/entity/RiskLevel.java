package com.aura.screening.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RiskLevel {
  LOW,
  MODERATE,
  HIGH,
  CRITICAL,
  UNVERIFIED;

  @JsonCreator
  public static RiskLevel fromString(String value) {
    if (value == null || value.isBlank()) return null;
    String clean = value.trim().toUpperCase();
    if ("SEVERE".equals(clean) || "ALARM".equals(clean)) {
      return CRITICAL;
    }
    if ("MEDIUM".equals(clean)) {
      return MODERATE;
    }
    if ("NORMAL".equals(clean)) {
      return LOW;
    }
    if ("UNVERIFIED".equals(clean) || "UNKNOWN".equals(clean) || "NEED_REVIEW".equals(clean)) {
      return UNVERIFIED;
    }
    try {
      return RiskLevel.valueOf(clean);
    } catch (IllegalArgumentException e) {
      return UNVERIFIED;
    }
  }

  @JsonValue
  public String toValue() {
    return this.name();
  }
}
