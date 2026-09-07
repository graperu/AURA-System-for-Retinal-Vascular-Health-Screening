package com.aura.clinic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddClinicMemberRequest(@NotBlank @Email String doctorEmail) {}
