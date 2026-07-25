package com.aura.ai;
import com.aura.common.exception.AiServiceUnavailableException;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
@Service
public class AiHealthClient {
  private final RestClient client;
  public AiHealthClient(@Value("${aura.ai.service-url}") String url) {
    var factory = new JdkClientHttpRequestFactory();
    factory.setReadTimeout(Duration.ofSeconds(3));
    this.client = RestClient.builder().baseUrl(url).requestFactory(factory).build();
  }
  @SuppressWarnings("unchecked")
  public Map<String,Object> health() {
    try { return client.get().uri("/health").retrieve().body(Map.class); }
    catch (Exception ex) { throw new AiServiceUnavailableException("AI Core is unavailable", ex); }
  }
}
