package com.aura.bulk.repository;

import com.aura.bulk.entity.BulkScreeningItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BulkScreeningItemRepository extends JpaRepository<BulkScreeningItem, UUID> {

  List<BulkScreeningItem> findByBatchIdOrderByCreatedAtAsc(UUID batchId);

  Optional<BulkScreeningItem> findByBatchIdAndItemCode(UUID batchId, String itemCode);

  long countByBatchIdAndStatus(UUID batchId, String status);

  long countByBatchId(UUID batchId);
}
