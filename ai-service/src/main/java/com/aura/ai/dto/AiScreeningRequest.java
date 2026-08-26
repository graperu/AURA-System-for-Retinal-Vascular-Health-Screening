package com.aura.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record AiScreeningRequest(
    @NotBlank(message= "Patient ID cannot be blank")
    String patientId,
    @NotBlank(message = "Image URL cannot be blank")
    String imageUrl
) {
}

