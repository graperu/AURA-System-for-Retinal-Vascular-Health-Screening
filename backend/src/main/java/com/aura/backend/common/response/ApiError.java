package com.aura.backend.common.response;

import java.util.Map;

public record ApiError(String code, String message, Map<String, Object> details) {
}
