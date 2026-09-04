package com.aura.auth.repository;

import com.aura.auth.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select t from RefreshToken t join fetch t.user where t.tokenHash=:hash")
  Optional<RefreshToken> findByTokenHashForUpdate(@Param("hash") String hash);

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  @Modifying
  @Transactional
  @Query(
      "update RefreshToken t set t.revokedAt=:now where t.user.id=:userId and t.revokedAt is null")
  int revokeAllActiveByUserId(@Param("userId") UUID userId, @Param("now") java.time.Instant now);
}
