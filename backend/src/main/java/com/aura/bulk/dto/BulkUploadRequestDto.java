package com.aura.bulk.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Java 21 Record for Bulk Fundus Upload (≥100 images batch screening).
 */
public record BulkUploadRequestDto(
    @NotBlank(message = "Clinic ID is required")
    String clinicId,

    @NotBlank(message = "Campaign name is required")
    String campaignName,

    @NotEmpty(message = "Image items list cannot be empty")
    @Valid
    List<BulkImageItemUploadDto> imageItems
) {}
