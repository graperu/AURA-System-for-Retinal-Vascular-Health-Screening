package com.aura.backend.billing.exception;

/** Thrown when a USER account tries to buy a CLINIC-scoped package, or vice versa. */
public class PackageScopeMismatchException extends RuntimeException {
    public PackageScopeMismatchException(String message) {
        super(message);
    }
}
