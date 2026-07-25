package com.aura.backend.analysis.entity;

import com.aura.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "analysis_report")
public class AnalysisReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private User doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id")
    private User clinic;

    @Column(nullable = false)
    private String imageUrl;

    private String annotatedImageUrl;

    @Enumerated(EnumType.STRING)
    private AnalysisStatus status;

    private String riskLevel;
    private Double riskScore;
    private String modelVersion;

    @Column(columnDefinition = "TEXT")
    private String aiFindings;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
