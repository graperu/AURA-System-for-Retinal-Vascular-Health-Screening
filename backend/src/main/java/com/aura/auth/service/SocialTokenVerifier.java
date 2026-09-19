package com.aura.auth.service;

public interface SocialTokenVerifier {
  record VerifiedSocialUser(String email, String name) {}

  /**
   * Cryptographically verifies the social ID token for the specified provider.
   *
   * @param provider OAuth provider (e.g., "google")
   * @param idToken raw ID token issued by the provider
   * @return VerifiedSocialUser containing cryptographically verified email and name, or null if invalid
   */
  VerifiedSocialUser verifyToken(String provider, String idToken);
}
