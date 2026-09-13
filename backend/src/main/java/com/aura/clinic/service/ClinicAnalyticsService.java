package com.aura.clinic.service;

import com.aura.bulk.repository.BulkScreeningBatchRepository;
import com.aura.screening.entity.RiskLevel;
import com.aura.screening.entity.Screening;
import com.aura.screening.repository.ScreeningRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClinicAnalyticsService {

    public static final UUID DEFAULT_CLINIC_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    private final ScreeningRepository screeningRepository;
    private final BulkScreeningBatchRepository bulkBatchRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ClinicAnalyticsService(
            ScreeningRepository screeningRepository,
            BulkScreeningBatchRepository bulkBatchRepository) {
        this.screeningRepository = screeningRepository;
        this.bulkBatchRepository = bulkBatchRepository;
    }

    public ClinicAnalyticsService() {
        this(null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCampaignAnalytics() {
        return getCampaignAnalytics(DEFAULT_CLINIC_ID);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCampaignAnalytics(UUID clinicId) {
        UUID targetClinicId = clinicId != null ? clinicId : DEFAULT_CLINIC_ID;

        long totalCampaigns = bulkBatchRepository != null ? bulkBatchRepository.countByClinicId(targetClinicId) : 0L;
        long totalImages = screeningRepository != null ? screeningRepository.countByClinicId(targetClinicId) : 0L;
        long highRiskPatients = screeningRepository != null
                ? screeningRepository.countByClinicIdAndRiskLevelIn(
                    targetClinicId,
                    List.of(RiskLevel.HIGH, RiskLevel.CRITICAL))
                : 0L;

        Map<String, Object> data = new HashMap<>();
        data.put("totalCampaigns", totalCampaigns);
        data.put("totalImages", totalImages);
        data.put("highRiskPatients", highRiskPatients);
        return data;
    }

    @Transactional(readOnly = true)
    public String generateExportDataCsv() {
        return generateExportDataCsv(DEFAULT_CLINIC_ID);
    }

    @Transactional(readOnly = true)
    public String generateExportDataCsv(UUID clinicId) {
        UUID targetClinicId = clinicId != null ? clinicId : DEFAULT_CLINIC_ID;
        List<Screening> screenings = screeningRepository != null
                ? screeningRepository.findByClinicIdOrderByCreatedAtDesc(targetClinicId)
                : List.of();

        StringBuilder sb = new StringBuilder();
        sb.append("Screening ID,Patient ID,Eye Position,Scan Type,Risk Level,Risk Score,Status,Created At\n");

        for (Screening s : screenings) {
            sb.append(s.getId()).append(",")
              .append(s.getPatientId()).append(",")
              .append(s.getEyePosition() != null ? s.getEyePosition() : "").append(",")
              .append(s.getScanType() != null ? s.getScanType() : "").append(",")
              .append(s.getRiskLevel() != null ? s.getRiskLevel().name() : "").append(",")
              .append(s.getRiskScore() != null ? s.getRiskScore() : 0).append(",")
              .append(s.getStatus() != null ? s.getStatus().name() : "").append(",")
              .append(s.getCreatedAt() != null ? s.getCreatedAt().toString() : "").append("\n");
        }

        return sb.toString();
    }
}
