package com.aura.patient.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record UpdatePatientProfileRequest(
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    String fullName,

    @PastOrPresent(message = "Ngày sinh không được ở tương lai")
    LocalDate dateOfBirth,

    @Min(value = 1, message = "Tuổi phải từ 1 đến 120")
    @Max(value = 120, message = "Tuổi phải từ 1 đến 120")
    Integer age,

    @Pattern(regexp = "^(Male|Female|Other)?$", message = "Giới tính phải là Male, Female hoặc Other")
    String gender,

    @Size(max = 32, message = "Số điện thoại không được vượt quá 32 ký tự")
    String phoneNumber,

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    String address,

    @Pattern(regexp = "^(O\\+|O\\-|A\\+|A\\-|B\\+|B\\-|AB\\+|AB\\-)?$", message = "Nhóm máu không hợp lệ (hợp lệ: O+, O-, A+, A-, B+, B-, AB+, AB-)")
    String bloodType,

    @Min(value = 50, message = "Huyết áp tâm thu phải từ 50 đến 250 mmHg")
    @Max(value = 250, message = "Huyết áp tâm thu phải từ 50 đến 250 mmHg")
    Integer systolicBp,

    @Min(value = 30, message = "Huyết áp tâm trương phải từ 30 đến 180 mmHg")
    @Max(value = 180, message = "Huyết áp tâm trương phải từ 30 đến 180 mmHg")
    Integer diastolicBp,

    @DecimalMin(value = "2.0", message = "Chỉ số HbA1c phải từ 2.0% đến 20.0%")
    @DecimalMax(value = "20.0", message = "Chỉ số HbA1c phải từ 2.0% đến 20.0%")
    Double hba1c,

    Boolean hasDiabetes,

    @Size(max = 32, message = "Loại đái tháo đường không hợp lệ")
    String diabetesType,

    @Min(value = 0, message = "Số năm mắc bệnh phải từ 0 đến 100")
    @Max(value = 100, message = "Số năm mắc bệnh phải từ 0 đến 100")
    Integer diabetesDurationYears,

    Boolean hasHypertension,

    Boolean historyOfSmoking,

    Boolean historyOfHeartDisease,

    Boolean historyOfStroke,

    @Size(max = 2000, message = "Danh mục thuốc không được vượt quá 2000 ký tự")
    String currentMedications,

    @Size(max = 1000, message = "Tiền sử dị ứng không được vượt quá 1000 ký tự")
    String allergies,

    @Size(max = 150, message = "Tên người liên hệ không được vượt quá 150 ký tự")
    String emergencyContactName,

    @Size(max = 32, message = "Số điện thoại người liên hệ không được vượt quá 32 ký tự")
    String emergencyContactPhone
) {}

