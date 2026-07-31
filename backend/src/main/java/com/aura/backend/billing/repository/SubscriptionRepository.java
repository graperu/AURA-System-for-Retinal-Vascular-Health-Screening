package com.aura.backend.billing.repository;

import com.aura.backend.billing.entity.ServicePackage;
import com.aura.backend.billing.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByOwnerIdAndServicePackageId(Long ownerId, Long servicePackageId);

    List<Subscription> findByOwnerId(Long ownerId);
}
