package com.aura.bulk;

import com.aura.bulk.dto.*;
import com.aura.bulk.queue.BatchJobQueue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BulkStatisticsAndAlertsTest {

    private BatchJobQueue jobQueue;

    @BeforeEach
    void setUp() {
        jobQueue = new BatchJobQueue();
    }

    private AiInferenceResultDto createMockAiResult(
            String id,
            int score,
            String cardioLevel,
            double strokeRisk,
            int anomaliesCount) {
        return new AiInferenceResultDto(
                "ANALYSIS-" + id,
                1200L,
                score,
                score,
                cardioLevel,
                score - 10,
                "Mild",
                strokeRisk,
                0.62,
                48.5,
                1.35,
                0.35,
                "https://aura.local/heatmaps/" + id + ".png",
                anomaliesCount,
                List.of("Artery-vein narrowing", "Focal tortuosity")
        );
    }

    @Test
    @DisplayName("TC-CLI-04: Giam sat rui ro tong hop (FR-25) - Tinh toan chinh xac phan bo ty le va cac chi so")
    void testCalculateRiskStatistics_FR25() {
        String batchId = "BATCH-TEST-FR25";
        jobQueue.createBatchJob(batchId, "CLINIC-001", 4);

        // Register 4 items: 1 Low, 1 Moderate, 1 High, 1 Critical
        BatchJobItemStatusDto item1 = new BatchJobItemStatusDto(
                "ITEM-1", "img1.png", "OD", "PAT-001", "COMPLETED", 1200L,
                createMockAiResult("1", 25, "Low", 5.0, 0)
        );
        BatchJobItemStatusDto item2 = new BatchJobItemStatusDto(
                "ITEM-2", "img2.png", "OS", "PAT-002", "COMPLETED", 1300L,
                createMockAiResult("2", 55, "Moderate", 12.0, 1)
        );
        BatchJobItemStatusDto item3 = new BatchJobItemStatusDto(
                "ITEM-3", "img3.png", "OD", "PAT-003", "COMPLETED", 1400L,
                createMockAiResult("3", 75, "High", 20.0, 2)
        );
        BatchJobItemStatusDto item4 = new BatchJobItemStatusDto(
                "ITEM-4", "img4.png", "OS", "PAT-004", "COMPLETED", 1500L,
                createMockAiResult("4", 92, "Critical", 28.5, 4)
        );

        jobQueue.registerItem(batchId, item1);
        jobQueue.registerItem(batchId, item2);
        jobQueue.registerItem(batchId, item3);
        jobQueue.registerItem(batchId, item4);

        // Update progress counters
        jobQueue.updateItemProgress(batchId, "ITEM-1", "COMPLETED", 1200L, item1.aiResult());
        jobQueue.updateItemProgress(batchId, "ITEM-2", "COMPLETED", 1300L, item2.aiResult());
        jobQueue.updateItemProgress(batchId, "ITEM-3", "COMPLETED", 1400L, item3.aiResult());
        jobQueue.updateItemProgress(batchId, "ITEM-4", "COMPLETED", 1500L, item4.aiResult());

        BulkBatchRiskStatisticsDto stats = jobQueue.calculateRiskStatistics(batchId);

        assertNotNull(stats, "Thong ke rui ro khong duoc rong");
        assertEquals(batchId, stats.batchId());
        assertEquals(4, stats.totalImages());
        assertEquals(4, stats.processedCount());
        assertEquals(2, stats.highRiskPatientCount(), "Phai co 2 benh nhan thuoc nhom High/Critical");

        RiskDistributionDto dist = stats.riskDistribution();
        assertEquals(1, dist.lowCount());
        assertEquals(25.0, dist.lowPercentage());
        assertEquals(1, dist.moderateCount());
        assertEquals(25.0, dist.moderatePercentage());
        assertEquals(1, dist.highCount());
        assertEquals(25.0, dist.highPercentage());
        assertEquals(1, dist.criticalCount());
        assertEquals(25.0, dist.criticalPercentage());

        // Average score: (25 + 55 + 75 + 92) / 4 = 61.75 -> 61.8
        assertEquals(61.8, stats.averageVascularRiskScore(), 0.1);
        // Average stroke: (5.0 + 12.0 + 20.0 + 28.5) / 4 = 16.375 -> 16.4
        assertEquals(16.4, stats.averageStrokeRiskPercent(), 0.1);
    }

    @Test
    @DisplayName("TC-CLI-08: Canh bao ca nguy co cao (FR-29) - Phat hien ca bat thuong nang & kich hoat canh bao")
    void testDetectEmergencyAlertsAndAbnormalTrends_FR29() {
        String batchId = "BATCH-TEST-FR29";
        jobQueue.createBatchJob(batchId, "CLINIC-002", 5);

        // 2 Low, 1 High, 2 Critical -> 3/5 (60%) high risk -> triggers abnormal trend
        jobQueue.registerItem(batchId, new BatchJobItemStatusDto(
                "ITEM-1", "img1.png", "OD", "PAT-001", "COMPLETED", 1000L,
                createMockAiResult("1", 20, "Low", 4.0, 0)
        ));
        jobQueue.registerItem(batchId, new BatchJobItemStatusDto(
                "ITEM-2", "img2.png", "OS", "PAT-002", "COMPLETED", 1000L,
                createMockAiResult("2", 30, "Low", 6.0, 0)
        ));
        jobQueue.registerItem(batchId, new BatchJobItemStatusDto(
                "ITEM-3", "img3.png", "OD", "PAT-003", "COMPLETED", 1000L,
                createMockAiResult("3", 78, "High", 19.5, 2)
        ));
        jobQueue.registerItem(batchId, new BatchJobItemStatusDto(
                "ITEM-4", "img4.png", "OS", "PAT-004", "COMPLETED", 1000L,
                createMockAiResult("4", 90, "Critical", 32.0, 3)
        ));
        jobQueue.registerItem(batchId, new BatchJobItemStatusDto(
                "ITEM-5", "img5.png", "OD", "PAT-005", "COMPLETED", 1000L,
                createMockAiResult("5", 88, "Critical", 26.0, 4)
        ));

        BulkBatchAlertSummaryDto summary = jobQueue.detectAlertsAndTrends(batchId);

        assertNotNull(summary);
        assertEquals(3, summary.totalAlerts(), "Phai phat hien dung 3 ca nguy co cao can canh bao");
        assertEquals(2, summary.criticalAlertsCount(), "Phai co 2 ca muc do CRITICAL");
        assertEquals(1, summary.warningAlertsCount(), "Phai co 1 ca muc do WARNING");

        // First alert should be the highest risk score (90)
        BulkBatchAlertDto topAlert = summary.alerts().get(0);
        assertEquals("CRITICAL", topAlert.severity());
        assertEquals("Critical", topAlert.riskLevel());
        assertEquals(90, topAlert.riskScore());
        assertEquals("PAT-004", topAlert.patientPseudonym());
        assertNotNull(topAlert.title());
        assertNotNull(topAlert.recommendedAction());

        // Check abnormal trend: 3/5 = 60% > 20% threshold
        assertTrue(summary.hasAbnormalTrend(), "Phai kich hoat canh bao xu huong bat thuong khi ty le vuot 20%");
        assertNotNull(summary.abnormalTrendMessage());
        assertTrue(summary.abnormalTrendMessage().contains("60.0%"));
    }
}