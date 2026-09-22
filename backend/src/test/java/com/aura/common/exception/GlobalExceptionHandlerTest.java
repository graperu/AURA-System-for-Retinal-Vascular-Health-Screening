package com.aura.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.common.response.ApiErrorResponse;
import com.aura.common.response.ErrorCode;
import org.junit.jupiter.api.Test;

class GlobalExceptionHandlerTest {

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  void mapsResourceNotFoundWithoutInternalDetails() {
    var response = handler.handleNotFound(new ResourceNotFoundException("Resource was not found"));

    assertThat(response.getStatusCode().value()).isEqualTo(404);
    ApiErrorResponse body = response.getBody();
    assertThat(body).isNotNull();
    assertThat(body.code()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
    assertThat(body.message()).isEqualTo("Resource was not found");
    assertThat(body.details()).isEmpty();
  }

  @Test
  void mapsServicePackageNotFoundExceptionTo404() {
    var ex = new com.aura.billing.exception.ServicePackageNotFoundException(999L);
    var response = handler.handleNotFound(ex);

    assertThat(response.getStatusCode().value()).isEqualTo(404);
    ApiErrorResponse body = response.getBody();
    assertThat(body).isNotNull();
    assertThat(body.code()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
    assertThat(body.message()).isEqualTo("Service package 999 not found.");
    assertThat(body.details()).isEmpty();
  }

  @Test
  void mapsIllegalStateExceptionTo409ConflictWithExplicitMessage() {
    var ex = new IllegalStateException("Khung giờ 09:30 ngày 2026-09-26 đã có người đặt trước. Vui lòng chọn khung giờ khác.");
    var response = handler.handleIllegalState(ex);

    assertThat(response.getStatusCode().value()).isEqualTo(409);
    ApiErrorResponse body = response.getBody();
    assertThat(body).isNotNull();
    assertThat(body.code()).isEqualTo(ErrorCode.INVALID_REQUEST);
    assertThat(body.message()).isEqualTo("Khung giờ 09:30 ngày 2026-09-26 đã có người đặt trước. Vui lòng chọn khung giờ khác.");
    assertThat(body.details()).isEmpty();
  }

  @Test
  void mapsDataIntegrityViolationExceptionTo409Conflict() {
    var ex = new org.springframework.dao.DataIntegrityViolationException("Unique constraint violation");
    var response = handler.handleDataIntegrityViolation(ex);

    assertThat(response.getStatusCode().value()).isEqualTo(409);
    ApiErrorResponse body = response.getBody();
    assertThat(body).isNotNull();
    assertThat(body.code()).isEqualTo(ErrorCode.INVALID_REQUEST);
    assertThat(body.message()).contains("đã có người đặt trước");
  }
}
