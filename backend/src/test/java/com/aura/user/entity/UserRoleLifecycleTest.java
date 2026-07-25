package com.aura.user.entity;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.GeneratedValue;
import org.hibernate.annotations.UuidGenerator;
import org.junit.jupiter.api.Test;

class UserRoleLifecycleTest {

    @Test
    void prePersistInitializesAssignedAtAndUuidMappingIsConfigured() throws Exception {
        UserRole userRole = new UserRole();

        userRole.onCreate();

        assertThat(userRole.getAssignedAt()).isNotNull();
        assertThat(UserRole.class.getDeclaredField("id").getAnnotation(GeneratedValue.class)).isNotNull();
        assertThat(UserRole.class.getDeclaredField("id").getAnnotation(UuidGenerator.class)).isNotNull();
    }
}
