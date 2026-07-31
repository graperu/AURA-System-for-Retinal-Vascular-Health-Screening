package com.aura.backend.billing.repository;

import com.aura.backend.billing.entity.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Page<PaymentTransaction> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);
}
