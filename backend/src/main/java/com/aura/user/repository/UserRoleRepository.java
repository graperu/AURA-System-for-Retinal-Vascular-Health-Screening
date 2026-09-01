package com.aura.user.repository;

import com.aura.user.entity.UserRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
  List<UserRole> findAllByUserId(UUID userId);

  List<UserRole> findAllByUserIdIn(List<UUID> userIds);
}
