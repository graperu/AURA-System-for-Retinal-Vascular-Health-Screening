package com.aura.backend.user.dto;

import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        Role role,
        AuthProvider provider,
        boolean enabled,
        LocalDateTime createdAt) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getFullName(),
                user.getRole(), user.getProvider(), user.isEnabled(), user.getCreatedAt());
    }
}
