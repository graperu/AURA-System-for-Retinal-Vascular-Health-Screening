package com.aura.auth.security;

import com.aura.common.response.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  public static final String JWT_ERROR_ATTRIBUTE = "aura.jwt.error";
  private final JwtTokenProvider tokens;
  private final CustomUserDetailsService users;

  public JwtAuthenticationFilter(JwtTokenProvider tokens, CustomUserDetailsService users) {
    this.tokens = tokens;
    this.users = users;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String authorization = request.getHeader("Authorization");
    if (authorization != null && authorization.startsWith("Bearer ")) {
      try {
        var principal =
            users.loadById(UUID.fromString(tokens.parse(authorization.substring(7)).getSubject()));
        var authentication =
            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
      } catch (ExpiredJwtException exception) {
        rejectToken(request, ErrorCode.TOKEN_EXPIRED);
      } catch (JwtException | IllegalArgumentException | UsernameNotFoundException exception) {
        rejectToken(request, ErrorCode.INVALID_TOKEN);
      }
    }
    chain.doFilter(request, response);
  }

  private void rejectToken(HttpServletRequest request, ErrorCode errorCode) {
    SecurityContextHolder.clearContext();
    request.setAttribute(JWT_ERROR_ATTRIBUTE, errorCode);
  }
}
