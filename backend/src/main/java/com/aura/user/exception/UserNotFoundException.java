package com.aura.user.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String userId) {
        super("Không tìm thấy người dùng với ID: " + userId);
    }
}