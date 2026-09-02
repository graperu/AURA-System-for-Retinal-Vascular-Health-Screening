package com.aura.auth.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.aura.auth.dto.RegisterRequest;
import com.aura.auth.exception.AuthException;
import com.aura.auth.security.JwtTokenProvider;
import com.aura.common.response.ErrorCode;
import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.role.repository.RoleRepository;
import com.aura.user.entity.*;
import com.aura.user.repository.*;
import java.lang.reflect.Field;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {
  UserRepository users = mock(UserRepository.class);
  RoleRepository roles = mock(RoleRepository.class);
  UserRoleRepository userRoles = mock(UserRoleRepository.class);
  PasswordEncoder encoder = mock(PasswordEncoder.class);
  AuthenticationManager manager = mock(AuthenticationManager.class);
  JwtTokenProvider jwt = mock(JwtTokenProvider.class);
  RefreshTokenService refresh = mock(RefreshTokenService.class);
  OtpService otpService = mock(OtpService.class);
  AuthService service = new AuthService(users, roles, userRoles, encoder, manager, jwt, refresh, otpService);

  @Test
  void registerNormalizesEmailHashesPasswordAndAssignsOnlyUser() throws Exception {
    var role = new Role();
    Field n = Role.class.getDeclaredField("name");
    n.setAccessible(true);
    n.set(role, RoleName.USER);
    when(users.existsByEmailIgnoreCase("user@example.test")).thenReturn(false);
    when(encoder.encode(any())).thenReturn("synthetic-hash");
    when(users.save(any())).thenAnswer(i -> i.getArgument(0));
    when(roles.findByName(RoleName.USER)).thenReturn(Optional.of(role));
    var response =
        service.register(
            new RegisterRequest(" User@Example.Test ", "StrongPassword123!", "Test User"));
    assertThat(response.email()).isEqualTo("user@example.test");
    assertThat(response.roles()).containsExactly("USER");
    verify(encoder).encode("StrongPassword123!");
    verify(userRoles).save(argThat(x -> x.getRole().getName() == RoleName.USER));
  }

  @Test
  void registerRejectsExistingEmail() {
    when(users.existsByEmailIgnoreCase("user@example.test")).thenReturn(true);
    assertThatThrownBy(
            () ->
                service.register(
                    new RegisterRequest("user@example.test", "StrongPassword123!", "Test")))
        .isInstanceOfSatisfying(
            AuthException.class,
            e -> assertThat(e.code()).isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS));
  }
}
