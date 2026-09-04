package com.aura.common.response;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ApiResponseSerializationTest {

  private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

  @Test
  void serializesSuccessEnvelope() throws Exception {
    String json =
        objectMapper.writeValueAsString(
            ApiResponse.success("Operation completed successfully", Map.of("status", "UP")));

    assertThat(json).contains("\"success\":true");
    assertThat(json).contains("\"message\":\"Operation completed successfully\"");
    assertThat(json).contains("\"status\":\"UP\"");
    assertThat(json).contains("\"timestamp\"");
  }
}
