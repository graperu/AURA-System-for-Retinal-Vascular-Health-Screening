package com.aura.screening.dto;

import com.aura.screening.entity.RiskLevel;
import jakarta.validation.constraints.NotBlank;

public record ReviewScreeningRequest(
    @NotBlank(message = "Ghi chú bác sĩ không được để trống")
    String doctorNotes,
    RiskLevel riskLevel
) {}
