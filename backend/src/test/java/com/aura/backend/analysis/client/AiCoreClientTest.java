package com.aura.backend.analysis.client;

import com.aura.backend.analysis.dto.DemoAnalysisRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AiCoreClientTest {

    @Test
    void analyzeCallsFastApiV1EndpointAndDeserializesResponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AiCoreClient client = new AiCoreClient(builder.baseUrl("http://ai-core:8000").build());
        UUID analysisId = UUID.fromString("7d3a2ac6-45be-4f78-9916-7028aa433edb");

        server.expect(once(), requestTo("http://ai-core:8000/api/v1/analyze"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {
                          "analysisId": "7d3a2ac6-45be-4f78-9916-7028aa433edb",
                          "status": "completed_mock",
                          "findings": ["Mock finding"],
                          "riskLevel": "low_mock",
                          "confidence": 0.87,
                          "modelVersion": "mock-retinal-v1",
                          "processedAt": "2026-07-22T00:00:00Z",
                          "disclaimer": "Mock result only"
                        }
                        """, MediaType.APPLICATION_JSON));

        var result = client.analyze(new DemoAnalysisRequest(
                analysisId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Fundus",
                "https://example.invalid/mock.jpg"));

        assertThat(result.analysisId()).isEqualTo(analysisId);
        assertThat(result.status()).isEqualTo("completed_mock");
        assertThat(result.modelVersion()).isEqualTo("mock-retinal-v1");
        server.verify();
    }
}
