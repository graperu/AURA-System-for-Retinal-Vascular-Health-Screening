package com.aura.backend.analysis.client;

import com.aura.backend.analysis.dto.AnalysisResponse;
import com.aura.backend.analysis.dto.DemoAnalysisRequest;
import com.aura.backend.common.exception.AiCoreUnavailableException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AiCoreClient {

    private final RestClient restClient;

    public AiCoreClient(RestClient aiCoreRestClient) {
        this.restClient = aiCoreRestClient;
    }

    public AnalysisResponse analyze(DemoAnalysisRequest request) {
        try {
            var response = restClient.post()
                    .uri("/api/v1/analyze")
                    .body(request)
                    .retrieve()
                    .body(AnalysisResponse.class);

            if (response == null) {
                throw new AiCoreUnavailableException("AI Core returned an empty response.", null);
            }
            return response;
        } catch (RestClientException exception) {
            throw new AiCoreUnavailableException("AI Core is unavailable.", exception);
        }
    }

    public boolean isHealthy() {
        try {
            return restClient.get()
                    .uri("/health")
                    .retrieve()
                    .toBodilessEntity()
                    .getStatusCode()
                    .is2xxSuccessful();
        } catch (RestClientException exception) {
            return false;
        }
    }
}
