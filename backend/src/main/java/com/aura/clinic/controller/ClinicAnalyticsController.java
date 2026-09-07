package com.aura.clinic.controller;

import com.aura.clinic.service.ClinicAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/clinic/analytics")
public class ClinicAnalyticsController {

    @Autowired
    private ClinicAnalyticsService analyticsService;

    @GetMapping("/campaigns")
    public ResponseEntity<Map<String, Object>> getCampaignAnalytics() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", analyticsService.getCampaignAnalytics());
        return ResponseEntity.ok(response);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportData() {
        String csvData = analyticsService.generateExportDataCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aura_clinic_export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
