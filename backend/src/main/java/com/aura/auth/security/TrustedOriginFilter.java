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
import org.springframework.util.StringUtils;
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

  @Override
  protected boolean shouldNotFilter(HttpServletRequest r) {
    if (!"POST".equalsIgnoreCase(r.getMethod())) {
      return true;
    }
    String normalizedPath = extractNormalizedPath(r);
    return !PATHS.contains(normalizedPath);
  }

  public static String extractNormalizedPath(HttpServletRequest request) {
    String uri = request.getRequestURI();
    if (uri == null || uri.isBlank()) {
      return "";
    }

    // 1. Strip context path if present
    String contextPath = request.getContextPath();
    if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
      uri = uri.substring(contextPath.length());
    }

    return normalizeUriPath(uri);
  }

  public static String normalizeUriPath(String rawPath) {
    if (rawPath == null || rawPath.isBlank()) {
      return "";
    }

    // 2. Strip matrix parameters (e.g., ;jsessionid=... or ;foo=bar)
    int semicolonIdx = rawPath.indexOf(';');
    String path = semicolonIdx >= 0 ? rawPath.substring(0, semicolonIdx) : rawPath;

    // 3. Clean dot-segments (. and ..) and normalize separators
    path = StringUtils.cleanPath(path);

    // 4. Collapse multiple consecutive slashes
    path = path.replaceAll("/{2,}", "/");

    // 5. Trim trailing slash if length > 1
    while (path.length() > 1 && path.endsWith("/")) {
      path = path.substring(0, path.length() - 1);
    }

    return path;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain c)
      throws ServletException, IOException {
    String origin = r.getHeader("Origin");
    if (origin == null) origin = originFromReferer(r.getHeader("Referer"));
    
    boolean isAllowed = allowed.contains("*") || (origin != null && allowed.contains(origin));
    if (!isAllowed) {
      boolean isLocal = isLocalOrigin(origin);
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

  private boolean isLocalOrigin(String origin) {
    if (origin == null || origin.isBlank()) {
      return false;
    }
    try {
      URI u = URI.create(origin);
      String host = u.getHost();
      return host != null && ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host));
    } catch (IllegalArgumentException e) {
      return false;
    }
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
