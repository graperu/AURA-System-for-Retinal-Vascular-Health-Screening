package com.aura.audit.repository;

import com.aura.audit.entity.AuditLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
  Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

  List<AuditLog> findTop1000ByOrderByCreatedAtDesc();

  Page<AuditLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
