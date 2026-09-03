package com.aura.auth.security;

import com.aura.auth.config.CorsProperties;
import com.aura.common.response.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.net.URI;
import java.util.*;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class TrustedOriginFilter extends OncePerRequestFilter {
  private static final Set<String> PATHS = Set.of("/api/v1/auth/refresh", "/api/v1/auth/logout");
  private final Set<String> allowed;
  private final ObjectMapper json;

  public TrustedOriginFilter(CorsProperties p, ObjectMapper j) {
    allowed = new HashSet<>(p.allowedOrigins());
    json = j;
  }

  protected boolean shouldNotFilter(HttpServletRequest r) {
    return !"POST".equals(r.getMethod()) || !PATHS.contains(r.getRequestURI());
  }

  protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain c)
      throws ServletException, IOException {
    String origin = r.getHeader("Origin");
    if (origin == null) origin = originFromReferer(r.getHeader("Referer"));
    
    boolean isAllowed = allowed.contains("*") || (origin != null && allowed.contains(origin));
    if (!isAllowed) {
      boolean isLocal = origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1"));
      if (!isLocal) {
        s.setStatus(403);
        s.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(
            s.getOutputStream(),
            ApiErrorResponse.of(ErrorCode.ACCESS_DENIED, "Nguồn yêu cầu không được phép", List.of()));
        return;
      }
    }
    c.doFilter(r, s);
  }

  private String originFromReferer(String value) {
    try {
      if (value == null) return null;
      URI u = URI.create(value);
      int port = u.getPort();
      return u.getScheme() + "://" + u.getHost() + (port < 0 ? "" : ":" + port);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}
