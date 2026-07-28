package com.aura.auth.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.common.response.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.InsufficientAuthenticationException;

class RestAuthenticationEntryPointTest {
  private final RestAuthenticationEntryPoint entryPoint =
      new RestAuthenticationEntryPoint(new ObjectMapper().findAndRegisterModules());

  @ParameterizedTest
  @MethodSource("errors")
  void returnsSafeSpecificAuthenticationError(ErrorCode attribute, ErrorCode expected)
      throws Exception {
    var request = new MockHttpServletRequest();
    if (attribute != null) {
      request.setAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE, attribute);
    }
    var response = new MockHttpServletResponse();

    entryPoint.commence(
        request, response, new InsufficientAuthenticationException("internal detail"));

    assertThat(response.getStatus()).isEqualTo(401);
    assertThat(response.getContentAsString())
        .contains(expected.name())
        .doesNotContain("internal detail")
        .doesNotContain("Bearer ");
  }

  private static Stream<Arguments> errors() {
    return Stream.of(
        Arguments.of(ErrorCode.TOKEN_EXPIRED, ErrorCode.TOKEN_EXPIRED),
        Arguments.of(ErrorCode.INVALID_TOKEN, ErrorCode.INVALID_TOKEN),
        Arguments.of(null, ErrorCode.UNAUTHORIZED));
  }
}
