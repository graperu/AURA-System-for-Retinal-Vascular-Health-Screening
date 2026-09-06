package com.aura.billing.exception;

public class PackageInactiveException extends RuntimeException {
    public PackageInactiveException(Long id) {
        super("Service package " + id + " is no longer available for purchase.");
    }
}