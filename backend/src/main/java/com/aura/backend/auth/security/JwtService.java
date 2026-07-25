package com.aura.backend.auth.security;

import com.aura.backend.auth.exception.InvalidTokenException;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and validates the two JWT types used by the API:
 *  - "access"  short-lived, sent as "Authorization: Bearer <token>" on every request
 *  - "refresh" longer-lived, sent only to POST /api/v1/auth/refresh to mint a new access token
 *
 * Both are stateless HS256 JWTs. There is no server-side revocation list in Milestone 2 —
 * a stolen refresh token stays valid until it expires. Revocation (e.g. a persisted
 * denylist keyed by token id, invalidated on logout/password change) is a known follow-up,
 * matching the "documented limitation" style already used in docs/architecture.md.
 */
@Component
public class JwtService {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] secretBytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("security.jwt.secret must be at least 32 bytes for HS256");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateAccessToken(User user) {
        return buildToken(user, TYPE_ACCESS, properties.getAccessTokenTtl().toMillis());
    }

    public String generateRefreshToken(User user) {
        return buildToken(user, TYPE_REFRESH, properties.getRefreshTokenTtl().toMillis());
    }

    public long accessTokenTtlSeconds() {
        return properties.getAccessTokenTtl().toSeconds();
    }

    private String buildToken(User user, String type, long ttlMillis) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .issuer(properties.getIssuer())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_TYPE, type)
                .claim("uid", user.getId())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(ttlMillis)))
                .signWith(signingKey)
                .compact();
    }

    /** Parses + verifies signature/expiration. Throws InvalidTokenException on any problem. */
    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(properties.getIssuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new InvalidTokenException("Token has expired.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Token is invalid.");
        }
    }

    public void requireType(Claims claims, String expectedType) {
        if (!expectedType.equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new InvalidTokenException("Expected a " + expectedType + " token.");
        }
    }

    public String subjectEmail(Claims claims) {
        return claims.getSubject();
    }

    public Role role(Claims claims) {
        return Role.valueOf(claims.get(CLAIM_ROLE, String.class));
    }

    public boolean isAccessToken(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public boolean isRefreshToken(Claims claims) {
        return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
    }
}
