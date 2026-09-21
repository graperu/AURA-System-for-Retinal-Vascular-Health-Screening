package com.aura.billing.repository;

import com.aura.billing.entity.PaymentTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Page<PaymentTransaction> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransaction p WHERE p.providerReference = :providerReference")
    Optional<PaymentTransaction> findByProviderReference(@Param("providerReference") String providerReference);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransaction p WHERE p.providerReference = :providerReference")
    Optional<PaymentTransaction> findByProviderReferenceForUpdate(@Param("providerReference") String providerReference);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransaction p WHERE LOWER(TRIM(p.transferContent)) = LOWER(TRIM(:transferContent))")
    Optional<PaymentTransaction> findByTransferContent(@Param("transferContent") String transferContent);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransaction p WHERE LOWER(TRIM(p.transferContent)) = LOWER(TRIM(:transferContent))")
    Optional<PaymentTransaction> findByTransferContentForUpdate(@Param("transferContent") String transferContent);

    @Query("SELECT p FROM PaymentTransaction p WHERE LOWER(TRIM(p.transferContent)) = LOWER(TRIM(:transferContent))")
    Optional<PaymentTransaction> findByTransferContentIgnoreCase(@Param("transferContent") String transferContent);

    boolean existsByServicePackageId(Long servicePackageId);
}
