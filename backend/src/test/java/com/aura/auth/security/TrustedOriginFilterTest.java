package com.aura.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.auth.config.CorsProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
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

  @Test
  @DisplayName("SEC-06: Trailing slash bypass POST /api/v1/auth/refresh/ is normalized and blocked for untrusted origin")
  void rejectsUntrustedOriginWithTrailingSlash() throws Exception {
    var request = request("/api/v1/auth/refresh/");
    request.addHeader("Origin", "https://attacker.example");
    var response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(403);
    assertThat(response.getContentAsString()).contains("ACCESS_DENIED");
  }

  @Test
  @DisplayName("SEC-06: Trailing slash with trusted origin is permitted")
  void allowsTrustedOriginWithTrailingSlash() throws Exception {
    var request = request("/api/v1/auth/refresh/");
    request.addHeader("Origin", TRUSTED_ORIGIN);
    var chain = new MockFilterChain();

    filter.doFilter(request, new MockHttpServletResponse(), chain);

    assertThat(chain.getRequest()).isSameAs(request);
  }

  @Test
  @DisplayName("SEC-06: Multiple consecutive slashes //api/v1/auth/refresh are normalized and blocked for untrusted origin")
  void rejectsUntrustedOriginWithMultipleSlashes() throws Exception {
    var request = request("//api/v1/auth//refresh");
    request.addHeader("Origin", "https://attacker.example");
    var response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(403);
    assertThat(response.getContentAsString()).contains("ACCESS_DENIED");
  }

  @Test
  @DisplayName("SEC-06: Matrix parameters /api/v1/auth/refresh;jsessionid=... are normalized and blocked for untrusted origin")
  void rejectsUntrustedOriginWithMatrixParameters() throws Exception {
    var request = request("/api/v1/auth/refresh;jsessionid=abcdef123456");
    request.addHeader("Origin", "https://attacker.example");
    var response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(403);
    assertThat(response.getContentAsString()).contains("ACCESS_DENIED");
  }

  @Test
  @DisplayName("SEC-06: Dot segments /api/v1/auth/./refresh are normalized and blocked for untrusted origin")
  void rejectsUntrustedOriginWithDotSegments() throws Exception {
    var request = request("/api/v1/auth/./refresh");
    request.addHeader("Origin", "https://attacker.example");
    var response = new MockHttpServletResponse();

    filter.doFilter(request, response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(403);
    assertThat(response.getContentAsString()).contains("ACCESS_DENIED");
  }

  @Test
  @DisplayName("SEC-06: Non-target paths such as /api/v1/auth/login pass through without origin filter")
  void nonTargetPathsPassThrough() throws Exception {
    var request = request("/api/v1/auth/login");
    request.addHeader("Origin", "https://anywhere.example");
    var chain = new MockFilterChain();

    filter.doFilter(request, new MockHttpServletResponse(), chain);

    assertThat(chain.getRequest()).isSameAs(request);
  }

  private MockHttpServletRequest request(String path) {
    var request = new MockHttpServletRequest("POST", path);
    request.setRequestURI(path);
    return request;
  }
}
