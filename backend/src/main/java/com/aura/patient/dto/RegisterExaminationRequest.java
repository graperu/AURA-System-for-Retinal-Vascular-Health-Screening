package com.aura.patient.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;

public record RegisterExaminationRequest(
    UUID doctorId,
    String examinationReason,
    String eyePosition,
    @Min(value = 50, message = "Huyết áp tâm thu tối thiểu 50 mmHg")
    @Max(value = 300, message = "Huyết áp tâm thu tối đa 300 mmHg")
    Integer systolicBp,
    @Min(value = 30, message = "Huyết áp tâm trương tối thiểu 30 mmHg")
    @Max(value = 200, message = "Huyết áp tâm trương tối đa 200 mmHg")
    Integer diastolicBp,
    @Min(value = 3, message = "HbA1c tối thiểu 3.0%")
    @Max(value = 20, message = "HbA1c tối đa 20.0%")
    Double hba1c,
    Boolean hasDiabetes,
    Boolean hasHypertension,
    Boolean historyOfSmoking,
    String symptomsNotes
) {}
