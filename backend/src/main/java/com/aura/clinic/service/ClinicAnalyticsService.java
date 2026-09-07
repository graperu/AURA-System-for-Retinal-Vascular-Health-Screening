package com.aura.clinic.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ClinicAnalyticsService {
    public Map<String, Object> getCampaignAnalytics() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalCampaigns", 15);
        data.put("totalImages", 1250);
        data.put("highRiskPatients", 42);
        return data;
    }

    public String generateExportDataCsv() {
        return "Campaign ID,Date,Images,High Risk\n" +
               "CAMP-001,2026-09-01,100,5\n" +
               "CAMP-002,2026-09-02,150,10\n";
    }
}
