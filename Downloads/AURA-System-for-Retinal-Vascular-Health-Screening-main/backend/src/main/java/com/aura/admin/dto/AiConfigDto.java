package com.aura.admin.dto;

public record AiConfigDto(
    String activeModelVersion,
    Double sensitivityThreshold,
    Double confidenceThreshold,
    Double avrWarningThreshold,
    Boolean autoRetrainEnabled,
    String lastUpdated) {}
