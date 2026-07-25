package com.aura.common.exception;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(AiServiceUnavailableException.class)
  ResponseEntity<Map<String,String>> unavailable(AiServiceUnavailableException ex) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("service","aura-ai-core","status","DOWN","message",ex.getMessage()));
  }
}
