package com.aura.backend.auth.dto;

import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;

public record UserSummary(Long id, String email, String fullName, Role role, AuthProvider provider) {

    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getProvider());
    }
}
