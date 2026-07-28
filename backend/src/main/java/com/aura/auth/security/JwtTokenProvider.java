package com.aura.auth.security;
import com.aura.auth.config.AuthProperties;
import io.jsonwebtoken.*; import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets; import java.time.*; import java.util.*; import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;
@Component public class JwtTokenProvider {
 private final SecretKey key; private final Duration ttl;
 public JwtTokenProvider(AuthProperties p){key=Keys.hmacShaKeyFor(p.jwtSecret().getBytes(StandardCharsets.UTF_8));ttl=Duration.ofMinutes(p.accessTokenMinutes());}
 public String create(UUID id,Collection<String> roles){Instant now=Instant.now();return Jwts.builder().subject(id.toString()).claim("roles",roles).issuedAt(Date.from(now)).expiration(Date.from(now.plus(ttl))).signWith(key).compact();}
 public Claims parse(String token){return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();}
 public long expiresIn(){return ttl.toSeconds();}
}
