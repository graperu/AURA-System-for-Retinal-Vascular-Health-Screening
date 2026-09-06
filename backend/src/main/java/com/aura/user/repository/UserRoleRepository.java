package com.aura.user.repository;

import com.aura.user.entity.UserRole;
import com.aura.user.entity.User;
import com.aura.role.enums.RoleName;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
  List<UserRole> findAllByUserId(UUID userId);

  List<UserRole> findAllByUserIdIn(List<UUID> userIds);

  @Query("select count(ur) > 0 from UserRole ur where ur.user.id = :userId and ur.role.name = :role")
  boolean existsByUserIdAndRole(@Param("userId") UUID userId, @Param("role") RoleName role);

  @Query("select ur.user from UserRole ur where ur.role.name = :role and ur.user.active = true order by ur.user.fullName, ur.user.email")
  List<User> findActiveUsersByRole(@Param("role") RoleName role);
}
