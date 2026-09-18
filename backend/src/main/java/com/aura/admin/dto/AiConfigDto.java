package com.aura.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiConfigDto(
    @JsonProperty("activeModelVersion") String activeModelVersion,
    @JsonProperty("sensitivityThreshold") Double sensitivityThreshold,
    @JsonProperty("confidenceThreshold") Double confidenceThreshold,
    @JsonProperty("avrWarningThreshold") Double avrWarningThreshold,
    @JsonProperty("autoRetrainEnabled") Boolean autoRetrainEnabled,
    @JsonProperty("lastUpdated") String lastUpdated,
    @JsonProperty("criticalThreshold") Integer criticalThreshold,
    @JsonProperty("highThreshold") Integer highThreshold,
    @JsonProperty("moderateThreshold") Integer moderateThreshold,
    @JsonProperty("brierScore") Double brierScore,
    @JsonProperty("calibrationMethod") String calibrationMethod
) {

  public AiConfigDto(
      String activeModelVersion,
      Double sensitivityThreshold,
      Double confidenceThreshold,
      Double avrWarningThreshold,
      Boolean autoRetrainEnabled,
      String lastUpdated) {
    this(
        activeModelVersion,
        sensitivityThreshold,
        confidenceThreshold,
        avrWarningThreshold,
        autoRetrainEnabled,
        lastUpdated,
        80,
        65,
        40,
        0.058,
        "Platt-Scaling");
  }
}
