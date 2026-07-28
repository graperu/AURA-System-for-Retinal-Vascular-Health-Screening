package com.aura.auth.security;

import com.aura.common.response.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {
  private final ObjectMapper json;

  public RestAccessDeniedHandler(ObjectMapper j) {
    json = j;
  }

  public void handle(HttpServletRequest r, HttpServletResponse s, AccessDeniedException e)
      throws IOException {
    s.setStatus(403);
    s.setContentType(MediaType.APPLICATION_JSON_VALUE);
    json.writeValue(
        s.getOutputStream(),
        ApiErrorResponse.of(ErrorCode.ACCESS_DENIED, "Không có quyền truy cập", List.of()));
  }
}
