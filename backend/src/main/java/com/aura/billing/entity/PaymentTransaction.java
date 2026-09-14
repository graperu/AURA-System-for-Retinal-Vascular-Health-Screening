package com.aura.billing.entity;

import com.aura.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One purchase/renewal attempt (FR-12: "view payment history"). Kept even on failure so the
 * user/clinic and Admin can see the full history, not just successful charges.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payment_transaction")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_package_id", nullable = false)
    private ServicePackage servicePackage;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    /** Payment provider that processed or rejected this transaction. */
    @Column(nullable = false)
    private String provider;

    /** Gateway's own reference id — useful once a real gateway (VNPay/Momo/Stripe) is wired in. */
    private String providerReference;

    private String failureReason;

    @Column(name = "transfer_content")
    private String transferContent;

    @Column(name = "qr_code_url", columnDefinition = "TEXT")
    private String qrCodeUrl;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "gateway_transaction_no")
    private String gatewayTransactionNo;

    @Column(name = "checksum")
    private String checksum;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (expiresAt == null) {
            expiresAt = createdAt.plusMinutes(15);
        }
    }
}
