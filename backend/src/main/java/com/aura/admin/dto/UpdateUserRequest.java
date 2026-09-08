package com.aura.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size (max = 150) String fullName,
    @Email @Size(max = 320) String email,
    Boolean emailVerified
) {
    
}
