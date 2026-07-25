package com.aura.backend.auth.security;

import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import com.aura.backend.user.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Handles the redirect back from Google (FR-1 social login).
 * Finds-or-creates a local User row for the Google account, then issues our own
 * access/refresh JWT pair so the rest of the API only ever has to deal with one
 * token format regardless of how the user originally signed in.
 *
 * Tokens are appended as a URL fragment (#access_token=...) rather than a query
 * string so they are never sent to the frontend's own server logs; the SPA route
 * at oauth2.frontend-redirect-uri is expected to read them from window.location.hash
 * and store them, then strip the fragment from the URL.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final String frontendRedirectUri;

    public OAuth2LoginSuccessHandler(
            UserRepository userRepository,
            JwtService jwtService,
            @Value("${oauth2.frontend-redirect-uri:http://localhost:5173/oauth2/callback}") String frontendRedirectUri) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.frontendRedirectUri = frontendRedirectUri;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String fullName = oauth2User.getAttribute("name");

        if (email == null) {
            response.sendRedirect(UriComponentsBuilder.fromUriString(frontendRedirectUri)
                    .queryParam("error", "google_account_has_no_email")
                    .build().toUriString());
            return;
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> userRepository.save(User.builder()
                .email(email)
                .fullName(fullName != null ? fullName : email)
                .role(Role.USER)
                .provider(AuthProvider.GOOGLE)
                .enabled(true)
                .build()));

        if (!user.isEnabled()) {
            response.sendRedirect(UriComponentsBuilder.fromUriString(frontendRedirectUri)
                    .queryParam("error", "account_disabled")
                    .build().toUriString());
            return;
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .fragment("access_token=" + accessToken + "&refresh_token=" + refreshToken)
                .build().toUriString();
        response.sendRedirect(redirectUrl);
    }
}
