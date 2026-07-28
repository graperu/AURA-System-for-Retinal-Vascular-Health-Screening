package com.aura.auth.security;

import com.aura.common.response.ApiErrorResponse;
import com.aura.common.response.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper json;

    public RestAuthenticationEntryPoint(ObjectMapper json) { this.json = json; }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException {
        Object value = request.getAttribute(JwtAuthenticationFilter.JWT_ERROR_ATTRIBUTE);
        ErrorCode code = value instanceof ErrorCode errorCode ? errorCode : ErrorCode.UNAUTHORIZED;
        String message = switch (code) {
            case TOKEN_EXPIRED -> "Access token has expired";
            case INVALID_TOKEN -> "Access token is invalid";
            default -> "Authentication is required";
        };
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getOutputStream(), ApiErrorResponse.of(code, message, List.of()));
    }
}
