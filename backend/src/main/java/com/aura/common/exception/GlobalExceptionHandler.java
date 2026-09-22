package com.aura.common.exception;

import com.aura.auth.exception.AuthException;
import com.aura.billing.exception.PaymentFailedException;
import com.aura.common.response.ApiErrorResponse;
import com.aura.common.response.ErrorCode;
import com.aura.common.response.ErrorDetail;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(AuthException.class)
  ResponseEntity<ApiErrorResponse> handleAuth(AuthException exception) {
    HttpStatus status =
        switch (exception.code()) {
          case EMAIL_ALREADY_EXISTS -> HttpStatus.CONFLICT;
          case ACCESS_DENIED -> HttpStatus.FORBIDDEN;
          case ACCOUNT_DISABLED,
                  INVALID_CREDENTIALS,
                  UNAUTHORIZED,
                  INVALID_TOKEN,
                  TOKEN_EXPIRED,
                  REFRESH_TOKEN_INVALID,
                  REFRESH_TOKEN_REVOKED ->
              HttpStatus.UNAUTHORIZED;
          default -> HttpStatus.BAD_REQUEST;
        };
    return response(
        status, ApiErrorResponse.of(exception.code(), exception.getMessage(), List.of()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
      MethodArgumentNotValidException exception) {
    List<ErrorDetail> details =
        exception.getBindingResult().getFieldErrors().stream().map(this::toDetail).toList();
    return response(
        HttpStatus.BAD_REQUEST,
        ApiErrorResponse.of(ErrorCode.VALIDATION_ERROR, "Request validation failed", details));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  ResponseEntity<ApiErrorResponse> handleConstraintViolation(
      ConstraintViolationException exception) {
    List<ErrorDetail> details =
        exception.getConstraintViolations().stream()
            .map(error -> new ErrorDetail(error.getPropertyPath().toString(), error.getMessage()))
            .toList();
    return response(
        HttpStatus.BAD_REQUEST,
        ApiErrorResponse.of(ErrorCode.VALIDATION_ERROR, "Request validation failed", details));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ApiErrorResponse> handleUnreadableMessage() {
    return response(
        HttpStatus.BAD_REQUEST,
        ApiErrorResponse.of(ErrorCode.INVALID_REQUEST, "Request body is invalid", List.of()));
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException exception) {
    return response(
        HttpStatus.NOT_FOUND,
        ApiErrorResponse.of(ErrorCode.RESOURCE_NOT_FOUND, exception.getMessage(), List.of()));
  }

  @ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
  ResponseEntity<ApiErrorResponse> handleAccessDenied() {
    return response(
        HttpStatus.FORBIDDEN,
        ApiErrorResponse.of(ErrorCode.ACCESS_DENIED, "Không có quyền truy cập", List.of()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException exception) {
    String msg = exception.getMessage() != null && !exception.getMessage().isBlank()
        ? exception.getMessage()
        : "Yêu cầu không hợp lệ";
    return response(
        HttpStatus.BAD_REQUEST,
        ApiErrorResponse.of(ErrorCode.INVALID_REQUEST, msg, List.of()));
  }

  @ExceptionHandler(PaymentFailedException.class)
  ResponseEntity<ApiErrorResponse> handlePaymentUnavailable(PaymentFailedException exception) {
    return response(
        HttpStatus.SERVICE_UNAVAILABLE,
        ApiErrorResponse.of(ErrorCode.INTERNAL_SERVER_ERROR, exception.getMessage(), List.of()));
  }

  @ExceptionHandler(com.aura.user.exception.UserNotFoundException.class)
  ResponseEntity<ApiErrorResponse> handleUserNotFound(com.aura.user.exception.UserNotFoundException exception) {
    return response(
        HttpStatus.NOT_FOUND,
        ApiErrorResponse.of(ErrorCode.RESOURCE_NOT_FOUND, exception.getMessage(), List.of()));
  }

  @ExceptionHandler({
      com.aura.billing.exception.PackageInactiveException.class,
      com.aura.billing.exception.PackageScopeMismatchException.class
  })
  ResponseEntity<ApiErrorResponse> handleBillingValidation(RuntimeException exception) {
    return response(
        HttpStatus.BAD_REQUEST,
        ApiErrorResponse.of(ErrorCode.INVALID_REQUEST, exception.getMessage(), List.of()));
  }

  @ExceptionHandler(IllegalStateException.class)
  ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException exception) {
    String msg = exception.getMessage() != null && !exception.getMessage().isBlank()
        ? exception.getMessage()
        : "Trạng thái yêu cầu không hợp lệ hoặc đã có xung đột";
    return response(
        HttpStatus.CONFLICT,
        ApiErrorResponse.of(ErrorCode.INVALID_REQUEST, msg, List.of()));
  }

  @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
  ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException exception) {
    String msg = "Dữ liệu bị trùng lặp hoặc khung giờ khám này đã có người đặt trước. Vui lòng thử lại với khung giờ khác.";
    return response(
        HttpStatus.CONFLICT,
        ApiErrorResponse.of(ErrorCode.INVALID_REQUEST, msg, List.of()));
  }

  @ExceptionHandler(ClinicalProcessingException.class)
  ResponseEntity<ApiErrorResponse> handleClinicalProcessing(ClinicalProcessingException exception) {
    return response(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ApiErrorResponse.of(
            ErrorCode.INVALID_REQUEST,
            exception.getMessage(),
            List.of()));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
    org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class).error("Unexpected error in request: ", exception);
    return response(
        HttpStatus.INTERNAL_SERVER_ERROR,
        ApiErrorResponse.of(
            ErrorCode.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", List.of()));
  }

  private ErrorDetail toDetail(FieldError error) {
    return new ErrorDetail(error.getField(), error.getDefaultMessage());
  }

  private ResponseEntity<ApiErrorResponse> response(HttpStatus status, ApiErrorResponse body) {
    return ResponseEntity.status(status).body(body);
  }
}
