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
import java.util.Base64;
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
  private final String firebaseApiKey;

  @Autowired
  public GoogleSocialTokenVerifier(
      ObjectMapper objectMapper,
      @Value("${aura.auth.google-client-id:}") String configuredClientId,
      @Value("${aura.auth.firebase-api-key:AIzaSyB3qOESpRPl79v77AJdWaz30c23BTdgucU}") String firebaseApiKey) {
    this(
        objectMapper,
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build(),
        configuredClientId,
        firebaseApiKey);
  }

  public GoogleSocialTokenVerifier(ObjectMapper objectMapper, String configuredClientId) {
    this(
        objectMapper,
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build(),
        configuredClientId,
        "AIzaSyB3qOESpRPl79v77AJdWaz30c23BTdgucU");
  }

  public GoogleSocialTokenVerifier(
      ObjectMapper objectMapper,
      HttpClient httpClient,
      String configuredClientId) {
    this(objectMapper, httpClient, configuredClientId, "AIzaSyB3qOESpRPl79v77AJdWaz30c23BTdgucU");
  }

  public GoogleSocialTokenVerifier(
      ObjectMapper objectMapper,
      HttpClient httpClient,
      String configuredClientId,
      String firebaseApiKey) {
    this.objectMapper = objectMapper;
    this.httpClient = httpClient;
    this.configuredClientId = configuredClientId;
    this.firebaseApiKey = firebaseApiKey;
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

    String trimmedToken = idToken.trim();

    // 1. Kiểm tra sơ bộ định dạng payload của JWT (header.payload.signature)
    String[] parts = trimmedToken.split("\\.");
    if (parts.length >= 2) {
      try {
        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        JsonNode payloadNode = objectMapper.readTree(payloadJson);
        String iss = payloadNode.has("iss") ? payloadNode.get("iss").asText() : "";

        // Nếu token được cấp bởi Firebase Auth (https://securetoken.google.com/...)
        if (iss.startsWith("https://securetoken.google.com/")) {
          VerifiedSocialUser fbUser = verifyFirebaseToken(trimmedToken);
          if (fbUser != null) {
            return fbUser;
          }
        }
      } catch (Exception e) {
        log.debug("Could not inspect token payload preview: {}", e.getMessage());
      }
    }

    // 2. Thử xác thực trực tiếp qua Google OAuth2 tokeninfo (dành cho Google OAuth ID Token)
    VerifiedSocialUser googleUser = verifyGoogleOAuthToken(trimmedToken);
    if (googleUser != null) {
      return googleUser;
    }

    // 3. Fallback: Thử qua Firebase Identity Toolkit
    return verifyFirebaseToken(trimmedToken);
  }

  private VerifiedSocialUser verifyGoogleOAuthToken(String idToken) {
    try {
      String verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token="
          + URLEncoder.encode(idToken, StandardCharsets.UTF_8);
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
        log.debug("Google tokeninfo endpoint returned status: {}", response.statusCode());
      }
    } catch (Exception e) {
      log.debug("Exception during Google token verification: {}", e.getMessage());
    }
    return null;
  }

  private VerifiedSocialUser verifyFirebaseToken(String idToken) {
    try {
      String key = (firebaseApiKey != null && !firebaseApiKey.isBlank())
          ? firebaseApiKey.trim()
          : "AIzaSyB3qOESpRPl79v77AJdWaz30c23BTdgucU";
      String lookupUrl = "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + key;
      String requestBody = objectMapper.writeValueAsString(java.util.Map.of("idToken", idToken));

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(lookupUrl))
          .header("Content-Type", "application/json")
          .timeout(Duration.ofSeconds(4))
          .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 200) {
        JsonNode root = objectMapper.readTree(response.body());
        if (root.has("users") && root.get("users").isArray() && !root.get("users").isEmpty()) {
          JsonNode userNode = root.get("users").get(0);
          boolean emailVerified = userNode.has("emailVerified") && userNode.get("emailVerified").asBoolean();
          if (emailVerified && userNode.has("email")) {
            String verifiedEmail = userNode.get("email").asText().trim().toLowerCase(Locale.ROOT);
            String verifiedName = userNode.has("displayName") ? userNode.get("displayName").asText().trim() : null;
            return new VerifiedSocialUser(verifiedEmail, verifiedName);
          } else {
            log.warn("Firebase token rejected: email is unverified or missing");
          }
        }
      } else {
        log.warn("Firebase Identity Toolkit lookup returned status: {}", response.statusCode());
      }
    } catch (Exception e) {
      log.error("Exception during Firebase token verification: {}", e.getMessage());
    }
    return null;
  }
}
