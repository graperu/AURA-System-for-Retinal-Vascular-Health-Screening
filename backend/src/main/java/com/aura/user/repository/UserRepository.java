package com.aura.user.repository;

import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);
  boolean existsByEmailgnoreCaseAndIdNot(String email,UUID id);

  @Query(
      """
      select distinct u from User u
      left join UserRole ur on ur.user = u
      left join ur.role r
      where (:role is null or r.name = :role)
      and (
      :q is null or :q = ' '
      or lower(u.email) like lower(concat('%',:q,'%'))
      or lower(coalesce(u.fullName,' ')) like lower(concat('%', :q,'%'))
      )
  """)
  Page<User> search(@Param("q") String q, @Param("role") RoleName role, Pageable pageable);

    }
