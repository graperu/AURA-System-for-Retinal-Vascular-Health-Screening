package com.aura.backend.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * RBAC entry point (FR-32, NFR-12). Path-based rules below are the coarse layer;
 * fine-grained per-endpoint checks additionally use @PreAuthorize (see AdminUserController).
 * Session is stateless — every request re-authenticates from its own JWT, so there is
 * no server-side session store to scale (fits NFR-7/NFR-8 horizontal scaling).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthenticationFilter,
                                  JwtAuthenticationEntryPoint authenticationEntryPoint,
                                  JwtAccessDeniedHandler accessDeniedHandler,
                                  OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.oAuth2LoginSuccessHandler = oAuth2LoginSuccessHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Replaces the old WebConfiguration/WebMvcConfigurer CORS mapping. That approach only
     * applied CORS at the DispatcherServlet level, which runs AFTER the Spring Security
     * filter chain — so preflight OPTIONS requests to any authenticated path (e.g.
     * /api/v1/me/**, /api/v1/admin/**) were rejected by authorizeHttpRequests before ever
     * reaching MVC's CORS handling. Registering the source here and calling .cors(...)
     * below makes Spring Security itself permit preflight requests per-path.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins:http://localhost:5173}") String allowedOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService,
                                                         PasswordEncoder passwordEncoder) {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new org.springframework.security.authentication.ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable()) // stateless JWT API, no browser cookie session to protect
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(authorize -> authorize
                        // Public: health checks, auth endpoints, Google OAuth2 redirect/callback
                        .requestMatchers("/health", "/api/v1/system/**").permitAll()
                        .requestMatchers("/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        // Public pricing catalog (FR-34 read side) — no login required
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/packages").permitAll()
                        // TODO(auth-ui): frontend chưa có màn hình đăng nhập / lưu token (Milestone 1 demo
                        // button gọi thẳng, không có Authorization header). Tạm permitAll để không phá demo
                        // hiện có — gỡ dòng này ngay khi frontend có luồng login thật, vì FR-2 yêu cầu
                        // người dùng phải đăng nhập mới được phân tích ảnh.
                        .requestMatchers("/api/v1/analyses/demo").permitAll()
                        // Clinic-facing bulk analysis endpoints ([FR-22]-[FR-30])
                        .requestMatchers("/api/v1/clinics/**").hasAnyRole("CLINIC", "ADMIN")
                        // Doctor review endpoints ([FR-13]-[FR-21])
                        .requestMatchers("/api/v1/doctors/**").hasAnyRole("DOCTOR", "ADMIN")
                        // Admin-only user/role/system management ([FR-31]-[FR-39])
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        // Everything else (analyses, profile, etc.) just needs a logged-in user of any role
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2LoginSuccessHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
