package com.aura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Email không đúng định dạng chuẩn")
    @Size(max = 320, message = "Email không được vượt quá 320 ký tự")
    String email,

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^\\d{6}$", message = "Mã OTP phải gồm đúng 6 chữ số")
    String otp,

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 12, max = 128, message = "Mật khẩu phải từ 12 đến 128 ký tự")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
        message = "Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
    )
    String newPassword
) {}
