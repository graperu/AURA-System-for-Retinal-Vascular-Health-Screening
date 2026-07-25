package com.aura.common.response;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        boolean success,
        ErrorCode code,
        String message,
        List<ErrorDetail> details,
        Instant timestamp
) {
    public static ApiErrorResponse of(ErrorCode code, String message, List<ErrorDetail> details) {
        return new ApiErrorResponse(false, code, message, details, Instant.now());
    }
}
