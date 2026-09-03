package com.aura.patient.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdatePatientProfileRequest(
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    String fullName,

    LocalDate dateOfBirth,

    @Min(value = 1, message = "Tuổi phải từ 1 trở lên")
    @Max(value = 120, message = "Tuổi không hợp lệ")
    Integer age,

    String gender,

    @Size(max = 32, message = "Số điện thoại không hợp lệ")
    String phoneNumber,

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    String address,

    String bloodType,

    @Min(value = 50, message = "Huyết áp tâm thu không hợp lệ")
    @Max(value = 250, message = "Huyết áp tâm thu không hợp lệ")
    Integer systolicBp,

    @Min(value = 30, message = "Huyết áp tâm trương không hợp lệ")
    @Max(value = 180, message = "Huyết áp tâm trương không hợp lệ")
    Integer diastolicBp,

    @Min(value = 2, message = "Chỉ số HbA1c không hợp lệ")
    @Max(value = 20, message = "Chỉ số HbA1c không hợp lệ")
    Double hba1c,

    Boolean hasDiabetes,

    String diabetesType,

    @Min(value = 0, message = "Số năm mắc bệnh không hợp lệ")
    @Max(value = 100, message = "Số năm mắc bệnh không hợp lệ")
    Integer diabetesDurationYears,

    Boolean hasHypertension,

    Boolean historyOfSmoking,

    Boolean historyOfHeartDisease,

    Boolean historyOfStroke,

    String currentMedications,

    String allergies,

    @Size(max = 150, message = "Tên người liên hệ không được vượt quá 150 ký tự")
    String emergencyContactName,

    @Size(max = 32, message = "Số điện thoại người liên hệ không hợp lệ")
    String emergencyContactPhone
) {}
