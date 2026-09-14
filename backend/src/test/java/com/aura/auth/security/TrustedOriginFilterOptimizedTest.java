package com.aura.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.auth.config.CorsProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Method;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@DisplayName("TrustedOriginFilter - Optimized Default Port & URI Syntax Tests")
class TrustedOriginFilterOptimizedTest {

  private TrustedOriginFilter filter;
  private Method originFromRefererMethod;
  private static final String TRUSTED_DOMAIN = "https://aura.hospital";

  @BeforeEach
  void setUp() throws Exception {
    CorsProperties props = new CorsProperties(List.of(TRUSTED_DOMAIN, "http://clinic.example.com"));
    ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    filter = new TrustedOriginFilter(props, mapper);

    originFromRefererMethod = TrustedOriginFilter.class.getDeclaredMethod("originFromReferer", String.class);
    originFromRefererMethod.setAccessible(true);
  }

  @ParameterizedTest(name = "Referer URL \"{0}\" -> Extracted Origin: \"{1}\"")
  @CsvSource(value = {
    "https://aura.hospital/auth/login | https://aura.hospital",
    "http://clinic.example.com/portal/index.html | http://clinic.example.com",
    "https://sub.domain.org/path?query=123 | https://sub.domain.org",
    "http://localhost:3000/app | http://localhost:3000",
    "http://127.0.0.1:5173/dashboard | http://127.0.0.1:5173",
    "https://aura.hospital:8443/api | https://aura.hospital:8443"
  }, delimiter = '|')
  @DisplayName("originFromReferer: Xử lý chính xác cổng mặc định (port < 0 không kèm số port) và cổng chỉ định")
  void testOriginFromRefererPortHandling(String refererUrl, String expectedOrigin) throws Exception {
    String extracted = (String) originFromRefererMethod.invoke(filter, refererUrl);
    assertThat(extracted).isEqualTo(expectedOrigin);
  }

  @ParameterizedTest(name = "Malformed Referer: \"{0}\"")
  @ValueSource(strings = {
    "http://invalid host with spaces/index",
    "http://bad^domain.com/path",
    "http://example.com/test?query=invalid space"
  })
  @DisplayName("originFromReferer: Bắt ngoại lệ IllegalArgumentException và trả về null khi URI sai cú pháp")
  void testOriginFromRefererCatchesIllegalArgumentException(String invalidUri) throws Exception {
    String extracted = (String) originFromRefererMethod.invoke(filter, invalidUri);
    assertThat(extracted).isNull();
  }

  @Test
  @DisplayName("originFromReferer: Trả về null khi giá trị Referer truyền vào là null")
  void testOriginFromRefererNullInput() throws Exception {
    String extracted = (String) originFromRefererMethod.invoke(filter, (String) null);
    assertThat(extracted).isNull();
  }

  @Test
  @DisplayName("doFilterInternal: Cho phép yêu cầu khi Referer có cổng mặc định (port < 0) thuộc danh sách tin cậy")
  void testAllowsRefererWithDefaultPort() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
    request.addHeader("Referer", TRUSTED_DOMAIN + "/dashboard/patients"); // Không có explicit port
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isSameAs(request);
  }

  @Test
  @DisplayName("doFilterInternal: Chặn 403 khi Referer có cổng mặc định nhưng không thuộc danh sách tin cậy")
  void testBlocksUntrustedRefererWithDefaultPort() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
    request.addHeader("Referer", "https://untrusted-phishing.org/login");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(403);
    assertThat(response.getContentAsString()).contains("ACCESS_DENIED");
    assertThat(chain.getRequest()).isNull();
  }

  @ParameterizedTest(name = "Localhost Referer without explicit port: \"{0}\"")
  @ValueSource(strings = {"http://localhost/login", "http://127.0.0.1/dashboard"})
  @DisplayName("doFilterInternal: Cho phép Referer localhost hoặc 127.0.0.1 kể cả khi không khai báo explicit port")
  void testAllowsLocalhostRefererWithoutPort(String localReferer) throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/logout");
    request.addHeader("Referer", localReferer);
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isSameAs(request);
  }

  @Test
  @DisplayName("shouldNotFilter: Bỏ qua lọc cho các phương thức không phải POST hoặc URL không nằm trong PATHS")
  void testShouldNotFilterNonPostOrUnrelatedPaths() throws Exception {
    // 1. GET request đến endpoint refresh
    MockHttpServletRequest getRequest = new MockHttpServletRequest("GET", "/api/v1/auth/refresh");
    MockHttpServletResponse getResponse = new MockHttpServletResponse();
    MockFilterChain getChain = new MockFilterChain();
    filter.doFilter(getRequest, getResponse, getChain);
    assertThat(getChain.getRequest()).isSameAs(getRequest);

    // 2. POST request đến endpoint khác không thuộc PATHS (như /api/v1/screenings)
    MockHttpServletRequest otherPathRequest = new MockHttpServletRequest("POST", "/api/v1/screenings");
    MockHttpServletResponse otherPathResponse = new MockHttpServletResponse();
    MockFilterChain otherPathChain = new MockFilterChain();
    filter.doFilter(otherPathRequest, otherPathResponse, otherPathChain);
    assertThat(otherPathChain.getRequest()).isSameAs(otherPathRequest);
  }

  @Test
  @DisplayName("doFilterInternal: Chấp nhận mọi nguồn yêu cầu khi cấu hình CORS chứa ký tự đại diện '*'")
  void testAllowsWildcardOrigin() throws Exception {
    CorsProperties wildcardProps = new CorsProperties(List.of("*"));
    TrustedOriginFilter wildcardFilter = new TrustedOriginFilter(wildcardProps, new ObjectMapper().findAndRegisterModules());

    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
    request.addHeader("Origin", "https://anywhere.io");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    wildcardFilter.doFilter(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isSameAs(request);
  }
}
