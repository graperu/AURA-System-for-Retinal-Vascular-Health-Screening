package com.aura.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.aura.auth.controller.AuthController;
import com.aura.auth.service.RefreshTokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(AuthIntegrationTest.AdminTestController.class)
@Testcontainers
class AuthIntegrationTest {
    private static final String ORIGIN = "https://aura.example.test";
    private static final String EMAIL = "integration@example.test";
    private static final String PASSWORD = "SyntheticPassword123!";

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("aura.cors.allowed-origins", () -> ORIGIN);
        registry.add("aura.auth.cookie-secure", () -> "true");
        registry.add("aura.auth.cookie-same-site", () -> "Strict");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired RefreshTokenService refreshTokens;

    @BeforeEach
    void cleanData() {
        jdbc.update("DELETE FROM refresh_tokens");
        jdbc.update("DELETE FROM user_roles");
        jdbc.update("DELETE FROM users");
    }

    @Test
    void migrationV005IsApplied() {
        Integer applied = jdbc.queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE version = '005' AND success", Integer.class);
        assertThat(applied).isEqualTo(1);
    }

    @Test
    void registerPersistsHashedPasswordAndUserRoleAndRejectsDuplicateEmail() throws Exception {
        register(EMAIL).andExpect(status().isCreated());

        String hash = jdbc.queryForObject("SELECT password_hash FROM users WHERE email = ?", String.class, EMAIL);
        Integer roleCount = jdbc.queryForObject("""
                SELECT count(*) FROM user_roles ur JOIN users u ON u.id=ur.user_id
                JOIN roles r ON r.id=ur.role_id WHERE u.email=? AND r.name='USER'
                """, Integer.class, EMAIL);
        assertThat(hash).isNotEqualTo(PASSWORD).startsWith("$2");
        assertThat(roleCount).isEqualTo(1);

        register(EMAIL).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void loginStoresOnlyHashAndRefreshRotatesOnce() throws Exception {
        register(EMAIL).andExpect(status().isCreated());
        var login = login();
        Cookie oldCookie = login.getResponse().getCookie(AuthController.COOKIE);
        assertThat(oldCookie).isNotNull();
        String raw = oldCookie.getValue();
        List<String> stored = jdbc.queryForList("SELECT token_hash FROM refresh_tokens", String.class);
        assertThat(stored).doesNotContain(raw);

        var rotated = mvc.perform(post("/api/v1/auth/refresh").header("Origin", ORIGIN).cookie(oldCookie))
                .andExpect(status().isOk()).andReturn();
        Cookie newCookie = rotated.getResponse().getCookie(AuthController.COOKIE);
        assertThat(newCookie).isNotNull();
        assertThat(newCookie.getValue()).isNotEqualTo(raw);

        mvc.perform(post("/api/v1/auth/refresh").header("Origin", ORIGIN).cookie(oldCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_REVOKED"));
    }

    @Test
    void concurrentRotationAllowsOnlyOneUseAndDetectsReuse() throws Exception {
        register(EMAIL).andExpect(status().isCreated());
        String raw = login().getResponse().getCookie(AuthController.COOKIE).getValue();
        Callable<Boolean> rotate = () -> {
            try { refreshTokens.rotate(raw); return true; }
            catch (RuntimeException rejected) { return false; }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var results = executor.invokeAll(List.of(rotate, rotate));
            long successes = results.stream().filter(result -> {
                try { return result.get(); } catch (Exception exception) { throw new AssertionError(exception); }
            }).count();
            assertThat(successes).isEqualTo(1);
        }
        Integer active = jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE revoked_at IS NULL", Integer.class);
        assertThat(active).isZero();
    }

    @Test
    void logoutNeedsNoAccessTokenRevokesRefreshAndClearsExactCookie() throws Exception {
        register(EMAIL).andExpect(status().isCreated());
        Cookie cookie = login().getResponse().getCookie(AuthController.COOKIE);

        var result = mvc.perform(post("/api/v1/auth/logout").header("Origin", ORIGIN).cookie(cookie))
                .andExpect(status().isOk()).andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains(AuthController.COOKIE + "=").contains("Path=/api/v1/auth")
                .contains("HttpOnly").contains("Secure").contains("SameSite=Strict").contains("Max-Age=0");
        Integer active = jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE revoked_at IS NULL", Integer.class);
        assertThat(active).isZero();
    }

    @Test
    void protectedEndpointsReturn401And403Correctly() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
        register(EMAIL).andExpect(status().isCreated());
        JsonNode body = json.readTree(login().getResponse().getContentAsString());
        String accessToken = body.at("/data/accessToken").asText();
        mvc.perform(get("/api/v1/test/admin").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    void refreshAndLogoutRejectUntrustedOrigin() throws Exception {
        mvc.perform(post("/api/v1/auth/refresh").header("Origin", "https://attacker.example"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
        mvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    private org.springframework.test.web.servlet.ResultActions register(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Credentials(email, PASSWORD, "Integration User"))));
    }

    private org.springframework.test.web.servlet.MvcResult login() throws Exception {
        return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new Login(EMAIL, PASSWORD))))
                .andExpect(status().isOk()).andReturn();
    }

    record Credentials(String email, String password, String fullName) {}
    record Login(String email, String password) {}

    @RestController
    static class AdminTestController {
        @GetMapping("/api/v1/test/admin")
        @PreAuthorize("hasRole('ADMIN')")
        String adminOnly() { return "test-only"; }
    }
}
