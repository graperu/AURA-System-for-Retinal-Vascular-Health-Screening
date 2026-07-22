package com.aura.analysis.entity;

import java.time.LocalDateTime;

public class AnalysisReport {
    private Long id;
    private Long patientId;
    private Long doctorId;
    private Long clinicId;
    private String imageUrl;
    private AnalysisStatus status;
    private String riskLevel;
    private Double riskScore;
    private String modelVersion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
