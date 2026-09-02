package com.aura.auth.dto;

import java.util.*;

public record UserResponse(
    UUID id, String email, String fullName, List<String> roles, boolean active) {}
