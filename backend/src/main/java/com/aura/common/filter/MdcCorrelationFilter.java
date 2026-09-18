package com.aura.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * HIPAA NFR-18 Compliant Mapped Diagnostic Context (MDC) Correlation Filter.
 * Extracts or generates an X-Request-ID / correlationId for end-to-end audit tracing,
 * injects it into SLF4J MDC, and appends X-Request-ID to downstream HTTP response headers.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcCorrelationFilter extends OncePerRequestFilter {

  public static final String HEADER_REQUEST_ID = "X-Request-ID";
  public static final String HEADER_CORRELATION_ID = "X-Correlation-ID";
  public static final String MDC_KEY_REQUEST_ID = "requestId";
  public static final String MDC_KEY_CORRELATION_ID = "correlationId";

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String correlationId = extractOrGenerateCorrelationId(request);

    try {
      MDC.put(MDC_KEY_REQUEST_ID, correlationId);
      MDC.put(MDC_KEY_CORRELATION_ID, correlationId);

      response.setHeader(HEADER_REQUEST_ID, correlationId);

      filterChain.doFilter(request, response);
    } finally {
      MDC.remove(MDC_KEY_REQUEST_ID);
      MDC.remove(MDC_KEY_CORRELATION_ID);
    }
  }

  private String extractOrGenerateCorrelationId(HttpServletRequest request) {
    String headerVal = request.getHeader(HEADER_REQUEST_ID);
    if (headerVal == null || headerVal.isBlank()) {
      headerVal = request.getHeader(HEADER_CORRELATION_ID);
    }
    if (headerVal != null && !headerVal.isBlank()) {
      return headerVal.trim();
    }
    return UUID.randomUUID().toString();
  }

  public static String getCurrentCorrelationId() {
    String id = MDC.get(MDC_KEY_REQUEST_ID);
    return id != null ? id : "SYSTEM-INTERNAL";
  }
}
