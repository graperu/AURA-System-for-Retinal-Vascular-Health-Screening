package com.aura.backend.user.service;

import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import com.aura.backend.user.exception.SelfManagementNotAllowedException;
import com.aura.backend.user.exception.UserNotFoundException;
import com.aura.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserManagementServiceTest {

    private UserRepository userRepository;
    private UserManagementService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        service = new UserManagementService(userRepository);
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void adminCanPromoteAnotherUserToDoctor() {
        User target = user(2L, Role.USER);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));

        var result = service.updateRole(2L, Role.DOCTOR, 1L);

        assertThat(result.role()).isEqualTo(Role.DOCTOR);
    }

    @Test
    void adminCannotChangeTheirOwnRole() {
        User self = user(1L, Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> service.updateRole(1L, Role.USER, 1L))
                .isInstanceOf(SelfManagementNotAllowedException.class);
    }

    @Test
    void adminCannotDisableTheirOwnAccount() {
        User self = user(1L, Role.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(self));

        assertThatThrownBy(() -> service.updateStatus(1L, false, 1L))
                .isInstanceOf(SelfManagementNotAllowedException.class);
    }

    @Test
    void disablingAnotherAccountSucceeds() {
        User target = user(2L, Role.DOCTOR);
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));

        var result = service.updateStatus(2L, false, 1L);

        assertThat(result.enabled()).isFalse();
    }

    @Test
    void unknownUserIdThrowsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L)).isInstanceOf(UserNotFoundException.class);
    }

    private User user(Long id, Role role) {
        return User.builder()
                .id(id)
                .email("user" + id + "@example.com")
                .fullName("User " + id)
                .role(role)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build();
    }
}
