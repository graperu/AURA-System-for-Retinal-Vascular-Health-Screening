package com.aura.backend.common.response;

import java.util.UUID;

public record ApiEnvelope<T>(boolean success, T data, ApiError error, String traceId) {

    public static <T> ApiEnvelope<T> success(T data) {
        return new ApiEnvelope<>(true, data, null, UUID.randomUUID().toString());
    }

    public static ApiEnvelope<Void> failure(ApiError error) {
        return new ApiEnvelope<>(false, null, error, UUID.randomUUID().toString());
    }
}
