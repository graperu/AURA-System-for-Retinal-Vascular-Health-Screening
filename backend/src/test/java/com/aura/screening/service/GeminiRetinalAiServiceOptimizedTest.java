package com.aura.screening.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Flow;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("GeminiRetinalAiService - Optimized Streaming, Vision & Payload Unit Tests")
class GeminiRetinalAiServiceOptimizedTest {

  @Mock private HttpClient httpClient;
  @Mock private HttpResponse<String> httpResponse;

  private GeminiRetinalAiService aiService;

  @BeforeEach
  void setUp() {
    aiService = new GeminiRetinalAiService();
    ReflectionTestUtils.setField(aiService, "enabled", true);
    ReflectionTestUtils.setField(aiService, "apiUrl", "http://localhost:20128/v1/chat/completions");
    ReflectionTestUtils.setField(aiService, "apiKey", "test-key-2026");
    ReflectionTestUtils.setField(aiService, "model", "ag/gemini-3.7-flash-high");
    ReflectionTestUtils.setField(aiService, "httpClient", httpClient);
  }

  private String extractBody(HttpRequest request) {
    if (request == null || request.bodyPublisher().isEmpty()) {
      return "";
    }
    var subscriber = HttpResponse.BodySubscribers.ofString(StandardCharsets.UTF_8);
    request.bodyPublisher().get().subscribe(new Flow.Subscriber<>() {
      @Override
      public void onSubscribe(Flow.Subscription subscription) {
        subscriber.onSubscribe(subscription);
      }

      @Override
      public void onNext(ByteBuffer item) {
        subscriber.onNext(List.of(item));
      }

      @Override
      public void onError(Throwable throwable) {
        subscriber.onError(throwable);
      }

      @Override
      public void onComplete() {
        subscriber.onComplete();
      }
    });
    return subscriber.getBody().toCompletableFuture().join();
  }

  @ParameterizedTest(name = "Payload handling: imageInput=''{0}'', expectMultimodal={1}")
  @MethodSource("provideImagePayloadCases")
  @DisplayName("Data URI vs Web URL vs Relative Path vs Raw Base64 Multimodal Payload Routing")
  void testImagePayloadRouting(String imageInput, boolean expectMultimodal, String expectedContentFragment) throws Exception {
    String dummyJsonResponse = """
        {
          "choices": [
            {
              "message": {
                "content": "{\\"overallVascularRiskScore\\": 42}"
              }
            }
          ]
        }
        """;

    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(dummyJsonResponse);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", imageInput);

    assertThat(result).isNotNull();
    assertThat(result.get("overallVascularRiskScore")).isEqualTo(42);

    ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
    verify(httpClient).send(captor.capture(), any());

    String sentBody = extractBody(captor.getValue());
    if (expectMultimodal) {
      assertThat(sentBody).contains("\"type\":\"image_url\"");
      assertThat(sentBody).contains(expectedContentFragment);
    } else {
      assertThat(sentBody).doesNotContain("\"image_url\"");
      assertThat(sentBody).contains(expectedContentFragment);
    }
  }

  static Stream<Arguments> provideImagePayloadCases() {
    String rawBase64 = "X".repeat(220);
    return Stream.of(
        // Web HTTP/HTTPS
        Arguments.of("http://storage.aura.test/retina1.jpg", true, "http://storage.aura.test/retina1.jpg"),
        Arguments.of("https://storage.aura.test/retina2.png", true, "https://storage.aura.test/retina2.png"),
        // Data URI
        Arguments.of("data:image/jpeg;base64,123456", true, "data:image/jpeg;base64,123456"),
        // Raw base64 > 200 chars -> auto prefix data:image/png;base64,
        Arguments.of(rawBase64, true, "data:image/png;base64," + rawBase64),
        // Relative path -> sends text instruction
        Arguments.of("/assets/images/fundus_standard.png", false, "Phân tích sàng lọc vi mạch đáy mắt tiêu chuẩn cho mắt: OD"),
        // Null / blank -> sends short text prompt
        Arguments.of(null, false, "Phân tích sàng lọc vi mạch mắt: OD"),
        Arguments.of("   ", false, "Phân tích sàng lọc vi mạch mắt: OD")
    );
  }

  @Test
  @DisplayName("SSE Stream chunk parsing: Xử lý an toàn các dòng data: [DONE], empty chunks, missing delta content")
  void testSseStreamChunkParsingEdgeCases() throws Exception {
    String sseStreamResponse = """
        data: [DONE]
        data: 
        
        data: {"choices": []}
        data: {"choices": [{"delta": {}}]}
        data: {"choices": [{"delta": {"notContent": "ignored"}}]}
        data: {"corrupted": json-not-valid
        data: {"choices": [{"delta": {"content": "```json\\n{\\"overallVascularRiskScore\\": 62, "}}]}
        data: {"choices": [{"delta": {"content": "\\"confidence\\": 0.94}\\n```"}}]}
        data: [DONE]
        """;

    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(sseStreamResponse);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OS", "https://cdn.aura.test/eye.png");

    assertThat(result).isNotNull();
    assertThat(result.get("overallVascularRiskScore")).isEqualTo(62);
    assertThat(result.get("confidence")).isEqualTo(0.94);
  }

  @ParameterizedTest(name = "Markdown stripping format {index}")
  @ValueSource(strings = {
    "```json\n{\"overallVascularRiskScore\": 55, \"confidence\": 0.90}\n```",
    "```\n{\"overallVascularRiskScore\": 55, \"confidence\": 0.90}\n```",
    "```json{\"overallVascularRiskScore\": 55, \"confidence\": 0.90}```",
    "{\"overallVascularRiskScore\": 55, \"confidence\": 0.90}"
  })
  @DisplayName("Markdown strip code blocks: Làm sạch hoàn toàn ```json, ``` và khoảng trắng bao quanh")
  void testMarkdownStripCodeBlocksVariations(String rawContent) throws Exception {
    String jsonWrapper = "{\"choices\": [{\"message\": {\"content\": "
        + new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(rawContent)
        + "}}]}";

    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(jsonWrapper);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNotNull();
    assertThat(result.get("overallVascularRiskScore")).isEqualTo(55);
    assertThat(result.get("confidence")).isEqualTo(0.90);
  }

  @ParameterizedTest(name = "Invalid JSON fallback: {0}")
  @ValueSource(strings = {
    "<html><head><title>502 Bad Gateway</title></head><body>502 Bad Gateway</body></html>",
    "{\"choices\": [{\"message\": {\"content\": \"{malformed-not-json: true\"}}]}",
    "{\"choices\": []}",
    "{}",
    "{\"choices\": [{}]}",
    "{\"choices\": [{\"message\": {}}]}",
    "data: {\"choices\": [{}]}",
    "data: {\"choices\": [{\"delta\": {}}]}",
    "data: {\"choices\": [{\"delta\": {\"notContent\": 123}}]}",
    "data: {\"choices\": [{\"delta\": {\"content\": \"not-json-content\"}}]}"
  })
  @DisplayName("Invalid JSON parsing fallback: Khi nội dung trả về không phải JSON hợp lệ hoặc thiếu content -> fallback an toàn trả về null")
  void testInvalidJsonParsingFallbackReturnsNullSafely(String invalidPayload) throws Exception {
    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(invalidPayload);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNull();
  }

  @ParameterizedTest(name = "HTTP Non-2xx status code: {0}")
  @ValueSource(ints = {199, 301, 400, 401, 403, 404, 500, 502, 503})
  @DisplayName("Status code ngoài dải 2xx (< 200 hoặc >= 300) -> trả về null an toàn")
  void testNon2xxStatusCodesReturnNullSafely(int statusCode) throws Exception {
    when(httpResponse.statusCode()).thenReturn(statusCode);
    when(httpResponse.body()).thenReturn("{\"error\":\"upstream issue\"}");
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNull();
  }

  @Test
  @DisplayName("enabled == false: Bỏ qua toàn bộ cuộc gọi HTTP và trả về null ngay lập tức")
  void testEnabledFalseReturnsNullImmediately() throws Exception {
    ReflectionTestUtils.setField(aiService, "enabled", false);

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNull();
    org.mockito.Mockito.verifyNoInteractions(httpClient);
  }

  @ParameterizedTest(name = "Image payload edge cases: input=''{0}''")
  @MethodSource("provideAdditionalImageEdgeCases")
  @DisplayName("Payload edge cases: >200 chars bắt đầu bằng '/' hoặc <200 chars không phải url -> chuyển text fallback")
  void testAdditionalImagePayloadEdgeCases(String imageInput, String expectedFragment) throws Exception {
    String dummyJsonResponse = "{\"choices\": [{\"message\": {\"content\": \"{\\\"overallVascularRiskScore\\\": 50}\"}}]}";
    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(dummyJsonResponse);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OS", imageInput);

    assertThat(result).isNotNull();
    ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
    verify(httpClient).send(captor.capture(), any());
    String sentBody = extractBody(captor.getValue());
    assertThat(sentBody).contains(expectedFragment);
    assertThat(sentBody).doesNotContain("\"image_url\"");
  }

  static Stream<Arguments> provideAdditionalImageEdgeCases() {
    return Stream.of(
        // > 200 chars but starts with '/' -> relative path
        Arguments.of("/" + "A".repeat(210), "Phân tích sàng lọc vi mạch đáy mắt tiêu chuẩn cho mắt: OS"),
        // < 200 chars plain string (not data:, http://, https://)
        Arguments.of("relative_eye_scan.png", "Phân tích sàng lọc vi mạch đáy mắt tiêu chuẩn cho mắt: OS")
    );
  }

  @Test
  @DisplayName("L113: Raw Base64 > 200 ký tự không bắt đầu bằng '/' -> tự động gắn tiền tố data:image/png;base64,")
  void testRawBase64Over200CharsNotStartingWithSlashGetsPrefix() throws Exception {
    String rawBase64 = "B".repeat(205);
    String dummyJsonResponse = "{\"choices\": [{\"message\": {\"content\": \"{\\\"overallVascularRiskScore\\\": 45}\"}}]}";
    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(dummyJsonResponse);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", rawBase64);

    assertThat(result).isNotNull();
    ArgumentCaptor<HttpRequest> captor = ArgumentCaptor.forClass(HttpRequest.class);
    verify(httpClient, org.mockito.Mockito.atLeastOnce()).send(captor.capture(), any());
    String sentBody = extractBody(captor.getValue());
    assertThat(sentBody).contains("\"type\":\"image_url\"");
    assertThat(sentBody).contains("data:image/png;base64," + rawBase64);
  }

  @ParameterizedTest(name = "L147: HTTP Status code >= 300: {0} -> logs warning and returns null")
  @ValueSource(ints = {300, 302, 400, 403, 404, 500, 503})
  void testHttpStatusCodeGte300ReturnsNull(int statusCode) throws Exception {
    when(httpResponse.statusCode()).thenReturn(statusCode);
    when(httpResponse.body()).thenReturn("{\"error\": \"failed\"}");
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNull();
  }

  @ParameterizedTest(name = "L166, L168: JSON response missing choices, empty choices, or missing content: {0}")
  @ValueSource(strings = {
    "{\"otherField\": 123}",
    "{\"choices\": \"not-array\"}",
    "{\"choices\": []}",
    "{\"choices\": [{}]}",
    "{\"choices\": [{\"message\": {}}]}",
    "{\"choices\": [{\"message\": {\"role\": \"assistant\"}}]}"
  })
  void testStandardJsonMissingChoicesOrContentReturnsNull(String invalidJson) throws Exception {
    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(invalidJson);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNull();
  }

  @ParameterizedTest(name = "L185, L187: SSE delta missing choices, delta null, or missing content: {0}")
  @ValueSource(strings = {
    "data: {\"id\": \"test\"}",
    "data: {\"choices\": \"not-an-array\"}",
    "data: {\"choices\": []}",
    "data: {\"choices\": [{}]}",
    "data: {\"choices\": [{\"delta\": {}}]}",
    "data: {\"choices\": [{\"delta\": {\"role\": \"assistant\"}}]}"
  })
  void testSseMissingChoicesOrDeltaContentReturnsNull(String sseChunk) throws Exception {
    when(httpResponse.statusCode()).thenReturn(200);
    when(httpResponse.body()).thenReturn(sseChunk);
    doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

    Map<String, Object> result = aiService.analyzeRetinalVascular("OD", "https://cdn.aura.test/eye.png");

    assertThat(result).isNull();
  }
}
