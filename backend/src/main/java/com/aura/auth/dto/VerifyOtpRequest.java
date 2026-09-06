package com.aura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
    @NotBlank(message = "Địa chỉ email không được để trống")
    @Email(message = "Email không đúng định dạng chuẩn")
    String email,

    @NotBlank(message = "Mã OTP không được để trống")
    @Size(min = 6, max = 6, message = "Mã OTP gồm đúng 6 chữ số")
    String otp,

    String fullName,

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 12, max = 128, message = "Mật khẩu phải từ 12 đến 128 ký tự")
    String password,

    // FR-22: cho phép tự đăng ký vai trò CLINIC (Phòng khám); bỏ trống = USER (Bệnh nhân) mặc định
    @Pattern(regexp = "USER|CLINIC", message = "Chỉ được tự đăng ký vai trò USER hoặc CLINIC")
    String role
) {}
