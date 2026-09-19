package com.aura.admin.dto;

import java.util.List;
import java.util.UUID;

public record BatchDeleteUserRequest(List<UUID> userIds) {}
