package com.aura.admin.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
    @NotNull(message = "Active status is required") Boolean active) {}
