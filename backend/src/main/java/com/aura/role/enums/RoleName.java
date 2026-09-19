package com.aura.role.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum RoleName {
  USER,
  DOCTOR,
  ADMIN,
  CLINIC;

  @JsonCreator
  public static RoleName fromString(String value) {
    if (value == null || value.isBlank()) return null;
    String clean = value.trim().toUpperCase();
    if (clean.startsWith("ROLE_")) {
      clean = clean.substring(5);
    }
    // FE-05: Ánh xạ vai trò PATIENT từ Frontend về USER của CSDL
    if ("PATIENT".equals(clean)) {
      return USER;
    }
    return RoleName.valueOf(clean);
  }
}
