package com.aura.backend.system.controller;

import com.aura.backend.common.response.ApiEnvelope;
import com.aura.backend.system.dto.SystemInfoResponse;
import com.aura.backend.system.service.SystemStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemController {

    private final SystemStatusService systemStatusService;

    public SystemController(SystemStatusService systemStatusService) {
        this.systemStatusService = systemStatusService;
    }

    @GetMapping("/info")
    public ResponseEntity<ApiEnvelope<SystemInfoResponse>> getSystemInfo() {
        return ResponseEntity.ok(ApiEnvelope.success(systemStatusService.getSystemInfo()));
    }
}
