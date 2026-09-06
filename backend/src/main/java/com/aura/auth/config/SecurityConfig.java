package com.aura.auth.config;

import com.aura.auth.security.*;
import java.util.List;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties({AuthProperties.class, CorsProperties.class})
public class SecurityConfig {
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
      throws Exception {
    return configuration.getAuthenticationManager();
  }

  @Bean
  CorsConfigurationSource cors(CorsProperties properties) {
    CorsConfiguration config = new CorsConfiguration();
    List<String> origins = properties != null ? properties.allowedOrigins() : null;
    if (origins == null || origins.isEmpty()) {
      origins = List.of("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173");
    }
    config.setAllowedOrigins(origins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
    config.setAllowedHeaders(List.of("*"));
    config.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean
  SecurityFilterChain chain(
      HttpSecurity http,
      JwtAuthenticationFilter jwt,
      TrustedOriginFilter origin,
      RestAuthenticationEntryPoint entryPoint,
      RestAccessDeniedHandler deniedHandler)
      throws Exception {
    return http.cors(cors -> {})
        .csrf(csrf -> csrf.disable())
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(
            errors ->
                errors.authenticationEntryPoint(entryPoint).accessDeniedHandler(deniedHandler))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        HttpMethod.POST,
                        "/api/v1/auth/send-otp",
                        "/api/v1/auth/verify-otp",
                        "/api/v1/auth/register",
                        "/api/v1/auth/login",
                        "/api/v1/auth/google",
                        "/api/v1/auth/social",
                        "/api/v1/auth/refresh",
                        "/api/v1/auth/logout")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/system/health")
                    .permitAll()
                    .requestMatchers("/api/v1/doctor/**").hasRole("DOCTOR")
                    .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/v1/clinic/**").hasAnyRole("CLINIC", "ADMIN")
                    .anyRequest()
                    .authenticated())
        .addFilterBefore(origin, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
        .build();
  }
}
