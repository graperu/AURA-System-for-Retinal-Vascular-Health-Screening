package com.aura.backend.billing.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateServicePackageStatusRequest(@NotNull Boolean active) {
}
