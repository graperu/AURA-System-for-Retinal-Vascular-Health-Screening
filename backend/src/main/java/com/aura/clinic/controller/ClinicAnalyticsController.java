package com.aura.clinic.controller;

import com.aura.auth.exception.AuthException;
import com.aura.auth.security.AuraUserPrincipal;
import com.aura.clinic.service.ClinicAnalyticsService;
import com.aura.common.response.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinic/analytics")
public class ClinicAnalyticsController {

    private final ClinicAnalyticsService analyticsService;

    @Autowired
    public ClinicAnalyticsController(ClinicAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/campaigns")
    public ResponseEntity<Map<String, Object>> getCampaignAnalytics(
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        if (principal == null) {
            throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Phòng khám");
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analyticsService.getCampaignAnalytics(principal.id()));
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportData(
            @AuthenticationPrincipal AuraUserPrincipal principal) {
        if (principal == null) {
            throw new AuthException(ErrorCode.UNAUTHORIZED, "Yêu cầu đăng nhập tài khoản Phòng khám");
        }
        String csvData = analyticsService.generateExportDataCsv(principal.id());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aura_clinic_export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
