package com.aura.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.GeneratedValue;
import java.time.Instant;
import org.hibernate.annotations.UuidGenerator;
import org.junit.jupiter.api.Test;

class UserLifecycleTest {

    @Test
    void prePersistInitializesAuditTimestampsAndUuidMappingIsConfigured() throws Exception {
        User user = new User();

        user.onCreate();

        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getUpdatedAt()).isNotNull();
        assertThat(User.class.getDeclaredField("id").getAnnotation(GeneratedValue.class)).isNotNull();
        assertThat(User.class.getDeclaredField("id").getAnnotation(UuidGenerator.class)).isNotNull();
    }

    @Test
    void preUpdateRefreshesUpdatedAt() throws InterruptedException {
        User user = new User();
        user.onCreate();
        Instant before = user.getUpdatedAt();

        Thread.sleep(1);
        user.onUpdate();

        assertThat(user.getUpdatedAt()).isAfter(before);
    }
}
