package com.aura.family.dto;

import java.time.LocalDate;
import java.util.UUID;

public record FamilyMemberResponse(
    UUID id, String displayName, String relationship, LocalDate dateOfBirth, String gender, boolean active) {}
