package com.aura.auth.config;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.Test;

class AuthPropertiesTest {
  @Test
  void rejectsMissingOrShortSecret() {
    assertThatThrownBy(() -> new AuthProperties(null, 15, 7, "Lax", false))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> new AuthProperties("too-short", 15, 7, "Lax", false))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
