package com.aura.screening.dto;

import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.ReviewDecision;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ReviewScreeningRequest(
    @JsonProperty("decision")
    @NotNull(message = "Quyết định thẩm định không được để trống")
    ReviewDecision decision,

    @JsonProperty("doctorNotes")
    @NotBlank(message = "Ghi chú bác sĩ không được để trống")
    String doctorNotes,

    @JsonProperty("adjustedCardioRisk")
    RiskLevel adjustedCardioRisk,

    @JsonProperty("adjustedDrRisk")
    RiskLevel adjustedDrRisk,

    @JsonProperty("icd10Codes")
    @Size(max = 20, message = "Không được chọn quá 20 mã ICD-10")
    List<@NotBlank(message = "Mã ICD-10 không được để trống") String> icd10Codes,

    @JsonProperty("recommendations")
    String recommendations,

    @JsonProperty("doctorFindings")
    String doctorFindings
) {
  public ReviewScreeningRequest(
      ReviewDecision decision,
      String doctorNotes,
      RiskLevel adjustedCardioRisk,
      RiskLevel adjustedDrRisk,
      List<String> icd10Codes
  ) {
    this(decision, doctorNotes, adjustedCardioRisk, adjustedDrRisk, icd10Codes, null, null);
  }

  public ReviewScreeningRequest(
      ReviewDecision decision,
      String doctorNotes,
      RiskLevel adjustedCardioRisk,
      RiskLevel adjustedDrRisk,
      List<String> icd10Codes,
      String recommendations
  ) {
    this(decision, doctorNotes, adjustedCardioRisk, adjustedDrRisk, icd10Codes, recommendations, null);
  }
}

