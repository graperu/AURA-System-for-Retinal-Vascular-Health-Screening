package com.aura.backend.billing.exception;

public class ServicePackageNotFoundException extends RuntimeException {
    public ServicePackageNotFoundException(Long id) {
        super("Service package " + id + " not found.");
    }
}
