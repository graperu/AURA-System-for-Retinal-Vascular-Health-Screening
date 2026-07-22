package com.aura.backend.system.dto;

import java.time.Instant;

public record SystemInfoResponse(
        String name,
        String version,
        String environment,
        String status,
        DependencyStatus database,
        DependencyStatus aiCore,
        Instant timestampUtc) {
}
