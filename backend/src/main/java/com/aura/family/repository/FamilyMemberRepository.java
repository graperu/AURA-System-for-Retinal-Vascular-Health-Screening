package com.aura.family.repository;

import com.aura.family.entity.FamilyMember;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, UUID> {
  List<FamilyMember> findByOwnerUserIdOrderByCreatedAtAsc(UUID ownerUserId);
}
