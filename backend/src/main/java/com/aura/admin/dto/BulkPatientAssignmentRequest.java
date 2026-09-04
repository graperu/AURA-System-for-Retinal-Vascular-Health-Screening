package com.aura.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record BulkPatientAssignmentRequest(
    @NotNull UUID doctorId,
    @NotEmpty List<UUID> patientIds,
    boolean replaceExisting) {}
