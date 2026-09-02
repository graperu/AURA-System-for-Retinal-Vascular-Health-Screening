package com.aura.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aura.auth")
public record AuthProperties(
    String jwtSecret,
    long accessTokenMinutes,
    long refreshTokenDays,
    String cookieSameSite,
    boolean cookieSecure) {
  public AuthProperties {
    if (jwtSecret == null
        || jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32)
      throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes");
  }
}
