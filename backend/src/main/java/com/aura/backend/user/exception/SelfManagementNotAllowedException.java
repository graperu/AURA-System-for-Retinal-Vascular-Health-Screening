package com.aura.backend.user.exception;

/** Guardrail so an admin can't accidentally strip their own admin access (FR-32/FR-31 safety net). */
public class SelfManagementNotAllowedException extends RuntimeException {
    public SelfManagementNotAllowedException(String message) {
        super(message);
    }
}
