package com.aura.role.entity;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.GeneratedValue;
import org.hibernate.annotations.UuidGenerator;
import org.junit.jupiter.api.Test;

class RoleLifecycleTest {

  @Test
  void prePersistInitializesAuditTimestampsAndUuidMappingIsConfigured() throws Exception {
    Role role = new Role();

    role.onCreate();

    assertThat(role.getCreatedAt()).isNotNull();
    assertThat(role.getUpdatedAt()).isNotNull();
    assertThat(Role.class.getDeclaredField("id").getAnnotation(GeneratedValue.class)).isNotNull();
    assertThat(Role.class.getDeclaredField("id").getAnnotation(UuidGenerator.class)).isNotNull();
  }

  @Test
  void preUpdateRefreshesUpdatedAt() throws InterruptedException {
    Role role = new Role();
    role.onCreate();
    var before = role.getUpdatedAt();

    Thread.sleep(1);
    role.onUpdate();

    assertThat(role.getUpdatedAt()).isAfter(before);
  }
}
