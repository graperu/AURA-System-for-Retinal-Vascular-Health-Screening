package com.aura.backend.system.controller;

import com.aura.backend.common.response.ApiEnvelope;
import com.aura.backend.system.dto.SystemInfoResponse;
import com.aura.backend.system.service.SystemStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final SystemStatusService systemStatusService;

    public HealthController(SystemStatusService systemStatusService) {
        this.systemStatusService = systemStatusService;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiEnvelope<SystemInfoResponse>> healthCheck() {
        return ResponseEntity.ok(ApiEnvelope.success(systemStatusService.getSystemInfo()));
    }
}
