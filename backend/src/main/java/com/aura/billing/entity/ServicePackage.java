package com.aura.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A purchasable plan defined by Admin (FR-34): how many analysis credits it grants,
 * for how long, at what price, and for which audience (INDIVIDUAL vs CLINIC).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "service_package")
public class ServicePackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PackageScope scope;

    /** Price in VND (project's home currency; see NFR-currency note in docs/architecture.md). */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** Number of retinal analyses this package grants. */
    @Column(nullable = false)
    private Integer credits;

    /** How many days the granted credits stay valid after purchase/renewal. */
    @Column(nullable = false)
    private Integer validityDays;

    /** Admin can retire a package (hide from /api/v1/packages) without deleting purchase history. */
    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

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