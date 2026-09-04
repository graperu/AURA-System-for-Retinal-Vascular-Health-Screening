package com.aura.billing.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** FR-34: Admin edits pricing/details of an existing package. Scope is intentionally not editable
 *  here — changing who a package is sold to after it has real subscribers is a data-integrity
 *  question (existing INDIVIDUAL subscribers on a package retargeted to CLINIC), so it's left
 *  as "retire this package, create a new one" rather than an in-place mutation. */
public record UpdateServicePackageRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal price,
        @NotNull @Min(1) Integer credits,
        @NotNull @Min(1) Integer validityDays) {
}