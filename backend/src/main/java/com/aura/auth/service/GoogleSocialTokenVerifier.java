package com.aura.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GoogleSocialTokenVerifier implements SocialTokenVerifier {
  private static final Logger log = LoggerFactory.getLogger(GoogleSocialTokenVerifier.class);

  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;
  private final String configuredClientId;

  @Autowired
  public GoogleSocialTokenVerifier(
      ObjectMapper objectMapper,
      @Value("${aura.auth.google-client-id:}") String configuredClientId) {
    this(
        objectMapper,
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build(),
        configuredClientId);
  }

  public GoogleSocialTokenVerifier(
      ObjectMapper objectMapper,
      HttpClient httpClient,
      String configuredClientId) {
    this.objectMapper = objectMapper;
    this.httpClient = httpClient;
    this.configuredClientId = configuredClientId;
  }

  @Override
  public VerifiedSocialUser verifyToken(String provider, String idToken) {
    if (provider == null || !provider.equalsIgnoreCase("google")) {
      log.warn("Unsupported social provider rejected: {}", provider);
      return null;
    }
    if (idToken == null || idToken.isBlank() || !idToken.contains(".")) {
      log.warn("Malformed or missing ID token rejected");
      return null;
    }

    try {
      String verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token="
          + URLEncoder.encode(idToken.trim(), StandardCharsets.UTF_8);
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(verifyUrl))
          .timeout(Duration.ofSeconds(4))
          .GET()
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        JsonNode node = objectMapper.readTree(response.body());

        if (configuredClientId != null && !configuredClientId.isBlank()) {
          String aud = node.has("aud") ? node.get("aud").asText() : "";
          if (!configuredClientId.equals(aud)) {
            log.warn("Google token audience mismatch: expected {}, got {}", configuredClientId, aud);
            return null;
          }
        }

        boolean emailVerified = node.has("email_verified") &&
            ("true".equalsIgnoreCase(node.get("email_verified").asText()) || node.get("email_verified").asBoolean());
        if (emailVerified && node.has("email")) {
          String verifiedEmail = node.get("email").asText().trim().toLowerCase(Locale.ROOT);
          String verifiedName = node.has("name") ? node.get("name").asText().trim() : null;
          return new VerifiedSocialUser(verifiedEmail, verifiedName);
        } else {
          log.warn("Google token rejected: email is unverified or missing");
        }
      } else {
        log.warn("Google tokeninfo endpoint returned status: {}", response.statusCode());
      }
    } catch (Exception e) {
      log.error("Exception during Google token verification: {}", e.getMessage());
    }
    return null;
  }
}
