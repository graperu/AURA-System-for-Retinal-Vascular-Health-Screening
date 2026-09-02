package com.aura.auth.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

class RegisterRequestValidationTest {
  private final jakarta.validation.Validator validator =
      Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void rejectsInvalidEmail() {
    assertThat(validator.validate(new RegisterRequest("bad", "StrongPassword123!", "Test User")))
        .anyMatch(v -> v.getPropertyPath().toString().equals("email"));
  }

  @Test
  void rejectsWeakPassword() {
    assertThat(validator.validate(new RegisterRequest("user@example.test", "weak", "Test User")))
        .anyMatch(v -> v.getPropertyPath().toString().equals("password"));
  }

  @Test
  void acceptsValidSyntheticRequest() {
    assertThat(
            validator.validate(
                new RegisterRequest("user@example.test", "StrongPassword123!", "Test User")))
        .isEmpty();
  }
}
