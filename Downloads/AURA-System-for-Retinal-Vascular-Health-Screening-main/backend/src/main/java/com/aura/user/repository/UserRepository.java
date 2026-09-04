package com.aura.user.repository;

import com.aura.user.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);
}
