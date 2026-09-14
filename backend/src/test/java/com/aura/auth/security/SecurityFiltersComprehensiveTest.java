package com.aura.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aura.auth.config.CorsProperties;
import com.aura.common.response.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class SecurityFiltersComprehensiveTest {

  @Nested
  @DisplayName("JwtAuthenticationFilter Tests")
  class JwtAuthenticationFilterTests {

    @Mock
    private JwtTokenProvider tokens;

    @Mock
    private CustomUserDetailsService users;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter jwtFilter;
    private UUID testUserId;
    private AuraUserPrincipal testPrincipal;

    @BeforeEach
    void setUp() {
      jwtFilter = new JwtAuthenticationFilter(tokens, users);
      testUserId = UUID.randomUUID();
      testPrincipal = new AuraUserPrincipal(
          testUserId,
          "doctor@aura.test",
          "Pass123!",
          true,
          List.of("DOCTOR")
      );
      SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
      SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Request có Authorization: Bearer <validToken> -> set Authentication vào SecurityContext")
    void validToken_setsSecurityContext() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer valid-jwt-token");
      MockHttpServletResponse response = new MockHttpServletResponse();

      Claims claims = mock(Claims.class);
      when(claims.getSubject()).thenReturn(testUserId.toString());
      when(tokens.parse("valid-jwt-token")).thenReturn(claims);
      when(users.loadById(testUserId)).thenReturn(testPrincipal);

      jwtFilter.doFilterInternal(request, response, filterChain);

      Authentication auth = SecurityContextHolder.getContext().getAuthentication();
      assertThat(auth).isNotNull();
      assertThat(auth.getPrincipal()).isEqualTo(testPrincipal);
      assertThat(auth.getAuthorities()).hasSize(1);
      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Request không có header Authorization -> tiếp tục filter chain, không set authentication")
    void missingAuthorizationHeader_continuesChain() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      MockHttpServletResponse response = new MockHttpServletResponse();

      jwtFilter.doFilterInternal(request, response, filterChain);

      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Request có header Authorization không bắt đầu bằng Bearer -> tiếp tục filter chain")
    void nonBearerAuthorization_continuesChain() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Basic YWRtaW46cGFzc3dvcmQ=");
      MockHttpServletResponse response = new MockHttpServletResponse();

      jwtFilter.doFilterInternal(request, response, filterChain);

      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Token hết hạn (ExpiredJwtException) -> rejectToken với ErrorCode.TOKEN_EXPIRED")
    void expiredToken_rejectsWithTokenExpired() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer expired-token");
      MockHttpServletResponse response = new MockHttpServletResponse();

      when(tokens.parse("expired-token")).thenThrow(new ExpiredJwtException(null, null, "Token expired"));

      jwtFilter.doFilterInternal(request, response, filterChain);

      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
      assertThat(request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE))
          .isEqualTo(ErrorCode.TOKEN_EXPIRED);
      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Token không hợp lệ (MalformedJwtException) -> rejectToken với ErrorCode.INVALID_TOKEN")
    void invalidToken_rejectsWithInvalidToken() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer malformed-token");
      MockHttpServletResponse response = new MockHttpServletResponse();

      when(tokens.parse("malformed-token")).thenThrow(new MalformedJwtException("Invalid token"));

      jwtFilter.doFilterInternal(request, response, filterChain);

      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
      assertThat(request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE))
          .isEqualTo(ErrorCode.INVALID_TOKEN);
      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Subject không phải UUID (IllegalArgumentException) -> rejectToken với ErrorCode.INVALID_TOKEN")
    void nonUuidSubject_rejectsWithInvalidToken() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer not-uuid-subject");
      MockHttpServletResponse response = new MockHttpServletResponse();

      Claims claims = mock(Claims.class);
      when(claims.getSubject()).thenReturn("not-a-valid-uuid");
      when(tokens.parse("not-uuid-subject")).thenReturn(claims);

      jwtFilter.doFilterInternal(request, response, filterChain);

      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
      assertThat(request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE))
          .isEqualTo(ErrorCode.INVALID_TOKEN);
      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("User không tồn tại (UsernameNotFoundException) -> rejectToken với ErrorCode.INVALID_TOKEN")
    void userNotFound_rejectsWithInvalidToken() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer unknown-user-token");
      MockHttpServletResponse response = new MockHttpServletResponse();

      Claims claims = mock(Claims.class);
      when(claims.getSubject()).thenReturn(testUserId.toString());
      when(tokens.parse("unknown-user-token")).thenReturn(claims);
      when(users.loadById(testUserId)).thenThrow(new UsernameNotFoundException("User not found"));

      jwtFilter.doFilterInternal(request, response, filterChain);

      assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
      assertThat(request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE))
          .isEqualTo(ErrorCode.INVALID_TOKEN);
      verify(filterChain).doFilter(request, response);
    }
  }

  @Nested
  @DisplayName("TrustedOriginFilter Tests")
  class TrustedOriginFilterTests {

    private TrustedOriginFilter originFilter;
    private ObjectMapper objectMapper;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
      objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
      CorsProperties props = new CorsProperties(List.of("https://app.aura.health", "https://portal.aura.health"));
      originFilter = new TrustedOriginFilter(props, objectMapper);
      filterChain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("shouldNotFilter trả về true với request GET hoặc path không phải refresh/logout")
    void shouldNotFilter_nonTargetRequests() {
      MockHttpServletRequest getReq = new MockHttpServletRequest("GET", "/api/v1/auth/refresh");
      assertThat(originFilter.shouldNotFilter(getReq)).isTrue();

      MockHttpServletRequest loginReq = new MockHttpServletRequest("POST", "/api/v1/auth/login");
      assertThat(originFilter.shouldNotFilter(loginReq)).isTrue();

      MockHttpServletRequest refreshReq = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      assertThat(originFilter.shouldNotFilter(refreshReq)).isFalse();

      MockHttpServletRequest logoutReq = new MockHttpServletRequest("POST", "/api/v1/auth/logout");
      assertThat(originFilter.shouldNotFilter(logoutReq)).isFalse();

      MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/v1/auth/refresh");
      assertThat(originFilter.shouldNotFilter(optionsReq)).isTrue();
    }

    @Test
    @DisplayName("Origin nằm trong danh sách tin cậy -> filterChain.doFilter được gọi")
    void trustedOrigin_passesFilter() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      request.addHeader("Origin", "https://app.aura.health");
      MockHttpServletResponse response = new MockHttpServletResponse();

      originFilter.doFilterInternal(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
      assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("Origin là localhost hoặc 127.0.0.1 -> cho phép đi tiếp (hỗ trợ phát triển cục bộ)")
    void localhostOrigin_passesFilter() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/logout");
      request.addHeader("Origin", "http://localhost:5173");
      MockHttpServletResponse response = new MockHttpServletResponse();

      originFilter.doFilterInternal(request, response, filterChain);

      verify(filterChain).doFilter(request, response);

      MockHttpServletRequest req127 = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      req127.addHeader("Origin", "http://127.0.0.1:3000");
      MockHttpServletResponse res127 = new MockHttpServletResponse();

      originFilter.doFilterInternal(req127, res127, filterChain);

      verify(filterChain).doFilter(req127, res127);
    }

    @Test
    @DisplayName("Origin null nhưng Referer trỏ về nguồn tin cậy -> trích xuất origin và cho phép đi tiếp")
    void trustedReferer_passesFilter() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      request.addHeader("Referer", "https://app.aura.health/auth/refresh");
      MockHttpServletResponse response = new MockHttpServletResponse();

      originFilter.doFilterInternal(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Origin không tin cậy -> chặn và trả về HTTP 403 Forbidden kèm JSON lỗi ACCESS_DENIED")
    void untrustedOrigin_returns403Forbidden() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      request.addHeader("Origin", "https://malicious-attacker.com");
      MockHttpServletResponse response = new MockHttpServletResponse();

      originFilter.doFilterInternal(request, response, filterChain);

      verify(filterChain, never()).doFilter(any(), any());
      assertThat(response.getStatus()).isEqualTo(403);
      assertThat(response.getContentType()).contains("application/json");
      assertThat(response.getContentAsString()).contains("ACCESS_DENIED");
      assertThat(response.getContentAsString()).contains("Nguồn yêu cầu không được phép");
    }

    @Test
    @DisplayName("Wildcard '*' được cấu hình trong CorsProperties -> cho phép mọi origin")
    void wildcardAllowed_passesFilter() throws ServletException, IOException {
      CorsProperties wildcardProps = new CorsProperties(List.of("*"));
      TrustedOriginFilter wildcardFilter = new TrustedOriginFilter(wildcardProps, objectMapper);

      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      request.addHeader("Origin", "https://any-external-domain.org");
      MockHttpServletResponse response = new MockHttpServletResponse();

      wildcardFilter.doFilterInternal(request, response, filterChain);

      verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Referer không hợp lệ hoặc dị dạng -> originFromReferer trả về null và bị từ chối 403")
    void invalidReferer_handledGracefully() throws ServletException, IOException {
      MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/refresh");
      request.addHeader("Referer", ":::not-a-valid-uri:::");
      MockHttpServletResponse response = new MockHttpServletResponse();

      originFilter.doFilterInternal(request, response, filterChain);

      assertThat(response.getStatus()).isEqualTo(403);
    }
  }
}
