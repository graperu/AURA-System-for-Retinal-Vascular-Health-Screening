package com.aura.family.dto;

import java.time.LocalDate;

public record CreateFamilyMemberRequest(
    String displayName, String relationship, LocalDate dateOfBirth, String gender) {}
