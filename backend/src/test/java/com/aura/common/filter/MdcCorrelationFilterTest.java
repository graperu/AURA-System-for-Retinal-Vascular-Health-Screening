package com.aura.common.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class MdcCorrelationFilterTest {

  private MdcCorrelationFilter filter;

  @BeforeEach
  void setUp() {
    filter = new MdcCorrelationFilter();
    MDC.clear();
  }

  @Test
  @DisplayName("Khi request có X-Request-ID, filter giữ nguyên giá trị và thiết lập vào response & MDC")
  void preservesExistingRequestIdHeader() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("X-Request-ID", "REQ-12345-ABC");
    MockHttpServletResponse response = new MockHttpServletResponse();

    final String[] capturedInChain = new String[1];
    FilterChain chain = (req, res) -> {
      capturedInChain[0] = MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID);
    };

    filter.doFilter(request, response, chain);

    assertThat(capturedInChain[0]).isEqualTo("REQ-12345-ABC");
    assertThat(response.getHeader("X-Request-ID")).isEqualTo("REQ-12345-ABC");
    // MDC cleared after request completes
    assertThat(MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID)).isNull();
  }

  @Test
  @DisplayName("Khi request không có header, filter tự sinh UUID correlationId mới")
  void generatesUuidWhenHeaderIsMissing() throws ServletException, IOException {
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();

    final String[] capturedInChain = new String[1];
    FilterChain chain = (req, res) -> {
      capturedInChain[0] = MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID);
    };

    filter.doFilter(request, response, chain);

    assertThat(capturedInChain[0]).isNotNull().isNotBlank();
    assertThat(response.getHeader("X-Request-ID")).isEqualTo(capturedInChain[0]);
    assertThat(MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID)).isNull();
  }

  @Test
  @DisplayName("Xử lý an toàn khi xảy ra exception trong filter chain, bảo đảm MDC được dọn dẹp")
  void cleansUpMdcEvenOnException() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    MockHttpServletResponse response = new MockHttpServletResponse();

    FilterChain failingChain = (req, res) -> {
      throw new RuntimeException("Simulated filter failure");
    };

    try {
      filter.doFilter(request, response, failingChain);
    } catch (Exception ignored) {
    }

    assertThat(MDC.get(MdcCorrelationFilter.MDC_KEY_REQUEST_ID)).isNull();
  }
}
