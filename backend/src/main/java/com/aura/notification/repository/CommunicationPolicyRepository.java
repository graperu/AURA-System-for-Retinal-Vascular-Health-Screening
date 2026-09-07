package com.aura.notification.repository;

import com.aura.notification.entity.CommunicationPolicy;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunicationPolicyRepository extends JpaRepository<CommunicationPolicy, UUID> {
  Optional<CommunicationPolicy> findByPolicyKey(String policyKey);
}
