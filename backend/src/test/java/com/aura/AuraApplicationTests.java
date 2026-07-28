package com.aura;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
class AuraApplicationTests {

    @Test
    void applicationClassIsLoadable() {
        assertThat(AuraApplication.class).isNotNull();
    }
}
