package com.aura.role.repository;

import com.aura.role.entity.RolePermission;
import com.aura.role.enums.RoleName;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
  List<RolePermission> findByRoleNameOrderByPermissionCodeAsc(RoleName roleName);

  List<RolePermission> findAllByOrderByRoleNameAscPermissionCodeAsc();
}
