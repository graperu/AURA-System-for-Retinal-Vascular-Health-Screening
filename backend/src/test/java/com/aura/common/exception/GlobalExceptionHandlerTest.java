package com.aura.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.aura.common.response.ApiErrorResponse;
import com.aura.common.response.ErrorCode;
import java.util.List;
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
}
