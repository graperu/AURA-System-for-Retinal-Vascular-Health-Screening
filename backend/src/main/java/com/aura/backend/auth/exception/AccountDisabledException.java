package com.aura.backend.auth.exception;

public class AccountDisabledException extends RuntimeException {
    public AccountDisabledException() {
        super("This account has been disabled. Contact an administrator.");
    }
}
