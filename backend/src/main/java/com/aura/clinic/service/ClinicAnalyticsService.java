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
    public Map<String, Object> getCampaignAnalytics(UUID clinicId) {
        if (clinicId == null) {
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("totalCampaigns", 0L);
            emptyData.put("totalImages", 0L);
            emptyData.put("highRiskPatients", 0L);
            return emptyData;
        }

        long totalCampaigns = bulkBatchRepository != null ? bulkBatchRepository.countByClinicId(clinicId) : 0L;
        long totalImages = screeningRepository != null ? screeningRepository.countByClinicId(clinicId) : 0L;
        long highRiskPatients = screeningRepository != null
                ? screeningRepository.countByClinicIdAndRiskLevelIn(
                    clinicId,
                    List.of(RiskLevel.HIGH, RiskLevel.CRITICAL))
                : 0L;

        Map<String, Object> data = new HashMap<>();
        data.put("totalCampaigns", totalCampaigns);
        data.put("totalImages", totalImages);
        data.put("highRiskPatients", highRiskPatients);
        return data;
    }

    public static final String MEDICAL_DISCLAIMER = "# TUYEN BO MIEN TRU Y TE: Ket qua phan tich do AI thuc hien chi nham muc dich ho tro sang loc va khong thay the chan doan chuyen mon cua bac si chuyen khoa.\n";
    public static final String CSV_HEADER = "Screening ID,Patient ID,Eye Position,Scan Type,Risk Level,Risk Score,Status,Created At\n";

    @Transactional(readOnly = true)
    public String generateExportDataCsv(UUID clinicId) {
        if (clinicId == null) {
            return MEDICAL_DISCLAIMER + CSV_HEADER;
        }

        List<Screening> screenings = screeningRepository != null
                ? screeningRepository.findByClinicIdOrderByCreatedAtDesc(clinicId)
                : List.of();

        StringBuilder sb = new StringBuilder();
        sb.append(MEDICAL_DISCLAIMER);
        sb.append(CSV_HEADER);

        for (Screening s : screenings) {
            sb.append(sanitizeCell(s.getId())).append(",")
              .append(sanitizeCell(s.getPatientId())).append(",")
              .append(sanitizeCell(s.getEyePosition())).append(",")
              .append(sanitizeCell(s.getScanType())).append(",")
              .append(sanitizeCell(s.getRiskLevel() != null ? s.getRiskLevel().name() : null)).append(",")
              .append(sanitizeCell(s.getRiskScore() != null ? s.getRiskScore() : 0)).append(",")
              .append(sanitizeCell(s.getStatus() != null ? s.getStatus().name() : null)).append(",")
              .append(sanitizeCell(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)).append("\n");
        }

        return sb.toString();
    }

    private String sanitizeCell(Object value) {
        if (value == null) {
            return "";
        }
        String str = value.toString();
        if (!str.isEmpty()) {
            char firstChar = str.charAt(0);
            if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@') {
                str = "'" + str;
            }
        }
        return str;
    }
}
