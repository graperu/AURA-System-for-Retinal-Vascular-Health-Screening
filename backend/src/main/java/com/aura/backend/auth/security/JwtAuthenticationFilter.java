package com.aura.backend.auth.security;

import com.aura.backend.auth.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads "Authorization: Bearer <access-token>", validates it and populates the
 * SecurityContext so downstream @PreAuthorize / hasRole(...) checks work.
 * A missing/invalid header simply leaves the request unauthenticated instead of
 * failing here — SecurityConfiguration decides per-path whether that is allowed.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HEADER);

        if (header == null || !header.startsWith(PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = header.substring(PREFIX.length());
            Claims claims = jwtService.parse(token);
            jwtService.requireType(claims, "access");

            var userDetails = userDetailsService.loadUserByUsername(jwtService.subjectEmail(claims));
            var authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (InvalidTokenException | org.springframework.security.core.userdetails.UsernameNotFoundException ignored) {
            // Leave unauthenticated; JwtAuthenticationEntryPoint reports 401 for protected paths.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
