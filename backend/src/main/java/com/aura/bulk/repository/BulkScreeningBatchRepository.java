package com.aura.bulk.repository;

import com.aura.bulk.entity.BulkScreeningBatch;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BulkScreeningBatchRepository extends JpaRepository<BulkScreeningBatch, UUID> {

  Optional<BulkScreeningBatch> findByBatchCode(String batchCode);

  List<BulkScreeningBatch> findByClinicIdOrderByCreatedAtDesc(UUID clinicId);

  long countByClinicId(UUID clinicId);

  boolean existsByBatchCode(String batchCode);
}
