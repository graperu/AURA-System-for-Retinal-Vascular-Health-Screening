package com.aura.backend.common.exception;

import com.aura.backend.auth.exception.AccountDisabledException;
import com.aura.backend.auth.exception.EmailAlreadyExistsException;
import com.aura.backend.auth.exception.InvalidCredentialsException;
import com.aura.backend.auth.exception.InvalidTokenException;
import com.aura.backend.common.response.ApiEnvelope;
import com.aura.backend.common.response.ApiError;
import com.aura.backend.user.exception.SelfManagementNotAllowedException;
import com.aura.backend.user.exception.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleEmailExists(EmailAlreadyExistsException exception) {
        var error = new ApiError("EMAIL_ALREADY_EXISTS", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleInvalidCredentials(InvalidCredentialsException exception) {
        var error = new ApiError("INVALID_CREDENTIALS", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleAccountDisabled(AccountDisabledException exception) {
        var error = new ApiError("ACCOUNT_DISABLED", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleInvalidToken(InvalidTokenException exception) {
        var error = new ApiError("INVALID_TOKEN", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleUserNotFound(UserNotFoundException exception) {
        var error = new ApiError("USER_NOT_FOUND", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(SelfManagementNotAllowedException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleSelfManagement(SelfManagementNotAllowedException exception) {
        var error = new ApiError("SELF_MANAGEMENT_NOT_ALLOWED", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, Object> details = new LinkedHashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            details.put(error.getField(), error.getDefaultMessage());
        }

        var error = new ApiError("VALIDATION_ERROR", "The request is invalid.", details);
        return ResponseEntity.badRequest().body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(AiCoreUnavailableException.class)
    public ResponseEntity<ApiEnvelope<Void>> handleAiCore(AiCoreUnavailableException exception) {
        LOGGER.warn("AI Core request failed", exception);
        var error = new ApiError("AI_CORE_UNAVAILABLE", exception.getMessage(), Map.of());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiEnvelope.failure(error));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiEnvelope<Void>> handleUnexpected(Exception exception) {
        LOGGER.error("Unhandled backend error", exception);
        var error = new ApiError("INTERNAL_ERROR", "An unexpected error occurred.", Map.of());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiEnvelope.failure(error));
    }
}
