package com.aura.billing.repository;

import com.aura.billing.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Optional<Subscription> findByOwnerIdAndServicePackageId(UUID ownerId, Long servicePackageId);

    List<Subscription> findByOwnerId(UUID ownerId);
}