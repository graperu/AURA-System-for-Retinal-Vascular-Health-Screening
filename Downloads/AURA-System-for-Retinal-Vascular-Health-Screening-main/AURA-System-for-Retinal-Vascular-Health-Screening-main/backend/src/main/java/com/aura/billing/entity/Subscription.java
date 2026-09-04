package com.aura.billing.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * The owner's (User or Clinic account — both are `User` rows, see Role) current
 * entitlement: how many analysis credits are left and when they expire (FR-11/FR-28
 * purchase-or-renew, FR-12 "remaining analysis credits").
 *
 * One row per (owner, servicePackage) pair. Renewing the same package adds credits
 * and extends validityDays from "now" rather than stacking a second row, so a user
 * always has a single, unambiguous credit balance per package they've bought.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subscription", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id", "service_package_id"}))
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_package_id", nullable = false)
    private ServicePackage servicePackage;

    @Column(nullable = false)
    private Integer remainingCredits;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

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