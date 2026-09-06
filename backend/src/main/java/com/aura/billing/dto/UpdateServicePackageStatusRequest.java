package com.aura.billing.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateServicePackageStatusRequest(@NotNull Boolean active) {
}