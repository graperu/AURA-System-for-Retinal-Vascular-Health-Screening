package com.aura.backend.billing.dto;

import com.aura.backend.billing.entity.PackageScope;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** FR-34: Admin defines a new sellable plan. */
public record CreateServicePackageRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String description,
        @NotNull PackageScope scope,
        @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal price,
        @NotNull @Min(1) Integer credits,
        @NotNull @Min(1) Integer validityDays) {
}
