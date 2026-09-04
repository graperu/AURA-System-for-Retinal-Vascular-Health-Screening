package com.aura.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.auth.config.CorsProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class TrustedOriginFilterTest {
  private static final String TRUSTED_ORIGIN = "https://aura.example.test";
  private final TrustedOriginFilter filter =
      new TrustedOriginFilter(
          new CorsProperties(List.of(TRUSTED_ORIGIN)), new ObjectMapper().findAndRegisterModules());

  @Test
  void allowsTrustedOriginForRefresh() throws Exception {
    var request = request("/api/v1/auth/refresh");
    request.addHeader("Origin", TRUSTED_ORIGIN);
    var chain = new MockFilterChain();

    filter.doFilter(request, new MockHttpServletResponse(), chain);

    assertThat(chain.getRequest()).isSameAs(request);
  }

  @Test
  void allowsTrustedRefererForLogout() throws Exception {
    var request = request("/api/v1/auth/logout");
    request.addHeader("Referer", TRUSTED_ORIGIN + "/account");
    var chain = new MockFilterChain();

    filter.doFilter(request, new MockHttpServletResponse(), chain);

    assertThat(chain.getRequest()).isSameAs(request);
  }

  @Test
  void rejectsMissingOrUntrustedOrigin() throws Exception {
    var request = request("/api/v1/auth/refresh");
    request.addHeader("Origin", "https://attacker.example");
    var response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(403);
    assertThat(response.getContentAsString()).contains("ACCESS_DENIED").doesNotContain("token");
  }

  private MockHttpServletRequest request(String path) {
    var request = new MockHttpServletRequest("POST", path);
    request.setRequestURI(path);
    return request;
  }
}
