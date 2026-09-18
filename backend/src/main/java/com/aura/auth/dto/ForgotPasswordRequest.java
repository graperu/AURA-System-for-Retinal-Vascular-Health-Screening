package com.aura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Email không đúng định dạng chuẩn")
    @Size(max = 320, message = "Email không được vượt quá 320 ký tự")
    String email
) {}
