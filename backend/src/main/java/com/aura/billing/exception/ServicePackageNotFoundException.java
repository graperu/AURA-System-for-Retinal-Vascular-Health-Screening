package com.aura.billing.exception;

import com.aura.common.exception.ResourceNotFoundException;

public class ServicePackageNotFoundException extends ResourceNotFoundException {
    public ServicePackageNotFoundException(Long id) {
        super("Service package " + id + " not found.");
    }

    public ServicePackageNotFoundException(String message) {
        super(message);
    }
}