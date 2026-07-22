package com.aura.backend.common.exception;

import com.aura.backend.common.response.ApiEnvelope;
import com.aura.backend.common.response.ApiError;
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
