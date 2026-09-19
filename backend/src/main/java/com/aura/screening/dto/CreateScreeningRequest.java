package com.aura.screening.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

public record CreateScreeningRequest(
    @JsonProperty("imageUrl")
    @NotBlank(message = "Đường dẫn ảnh không được để trống")
    String imageUrl,

    @JsonProperty("eyePosition")
    @JsonAlias("eye")
    @Pattern(
        regexp = "^(?i)(OD|OS|OU|LEFT_EYE|RIGHT_EYE|UNKNOWN|Right_OD|Left_OS|LEFT|RIGHT|L|R)?$",
        message = "Vị trí mắt không hợp lệ (chỉ chấp nhận OD, OS, OU, LEFT_EYE, RIGHT_EYE, UNKNOWN)"
    )
    String eyePosition,

    @JsonProperty("scanType")
    String scanType,

    @JsonProperty("fileName")
    String fileName,

    @JsonProperty("fileSize")
    Long fileSize,

    @JsonProperty("mimeType")
    String mimeType,

    @JsonProperty("riskScore")
    Integer riskScore,

    @JsonProperty("avRatio")
    Double avRatio,

    @JsonProperty("vesselDensity")
    String vesselDensity,

    @JsonProperty("clinicId")
    UUID clinicId
) {
  public CreateScreeningRequest(
      String imageUrl,
      String eyePosition,
      String scanType,
      String fileName,
      Long fileSize,
      String mimeType) {
    this(imageUrl, eyePosition, scanType, fileName, fileSize, mimeType, null, null, null, null);
  }

  public CreateScreeningRequest(String imageUrl) {
    this(imageUrl, "OD", "Fundus", "image.png", 0L, "image/png", null, null, null, null);
  }
}
