package com.aura.screening.dto;

import com.aura.screening.entity.RiskLevel;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record ReviewScreeningRequest(
    @JsonProperty("doctorNotes")
    @NotBlank(message = "Ghi chú bác sĩ không được để trống")
    String doctorNotes,

    @JsonProperty("riskLevel")
    RiskLevel riskLevel
) {}

