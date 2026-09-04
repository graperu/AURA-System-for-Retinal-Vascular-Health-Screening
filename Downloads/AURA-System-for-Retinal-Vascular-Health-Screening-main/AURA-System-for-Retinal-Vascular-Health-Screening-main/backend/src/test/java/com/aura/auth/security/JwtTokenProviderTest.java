package com.aura.auth.security;

import static org.assertj.core.api.Assertions.*;

import com.aura.auth.config.AuthProperties;
import io.jsonwebtoken.*;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtTokenProviderTest {
  private JwtTokenProvider provider(long minutes, String secret) {
    return new JwtTokenProvider(new AuthProperties(secret, minutes, 7, "Lax", false));
  }

  @Test
  void createsAndParsesMinimalClaims() {
    var id = UUID.randomUUID();
    var p = provider(15, "GENERATE_A_STRONG_SECRET_FOR_TESTS_ONLY");
    var claims = p.parse(p.create(id, List.of("USER")));
    assertThat(claims.getSubject()).isEqualTo(id.toString());
    Object rolesClaim = claims.get("roles");
    assertThat(rolesClaim).isInstanceOf(List.class);
    @SuppressWarnings("unchecked")
    List<String> roles = (List<String>) rolesClaim;
    assertThat(roles).containsExactly("USER");
    assertThat(claims.getIssuedAt()).isNotNull();
    assertThat(claims.getExpiration()).isNotNull();
  }

  @Test
  void rejectsWrongSignature() {
    var a = provider(15, "GENERATE_A_STRONG_SECRET_FOR_TESTS_ONLY");
    var b = provider(15, "DIFFERENT_STRONG_TEST_SECRET_PLACEHOLDER");
    assertThatThrownBy(() -> b.parse(a.create(UUID.randomUUID(), List.of("USER"))))
        .isInstanceOf(JwtException.class);
  }

  @Test
  void rejectsExpiredToken() {
    var p = provider(-1, "GENERATE_A_STRONG_SECRET_FOR_TESTS_ONLY");
    assertThatThrownBy(() -> p.parse(p.create(UUID.randomUUID(), List.of("USER"))))
        .isInstanceOf(ExpiredJwtException.class);
  }
}
