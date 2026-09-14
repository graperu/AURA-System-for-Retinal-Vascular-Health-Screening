package com.aura.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.aura.role.entity.Role;
import com.aura.role.enums.RoleName;
import com.aura.user.entity.User;
import com.aura.user.entity.UserRole;
import com.aura.user.repository.UserRepository;
import com.aura.user.repository.UserRoleRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService - Optimized Security Exception & Multi-Role Tests")
class CustomUserDetailsServiceOptimizedTest {

  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;

  private CustomUserDetailsService userDetailsService;
  private UUID userId;
  private User user;
  private Role adminRole;
  private Role doctorRole;

  @BeforeEach
  void setUp() {
    userDetailsService = new CustomUserDetailsService(userRepository, userRoleRepository);
    userId = UUID.randomUUID();

    user = new User("doctor.opt@aura.hospital", "hash_secret", "BS. Nguyen Van Optimized");
    ReflectionTestUtils.setField(user, "id", userId);
    user.setActive(true);

    adminRole = new Role();
    ReflectionTestUtils.setField(adminRole, "name", RoleName.ADMIN);

    doctorRole = new Role();
    ReflectionTestUtils.setField(doctorRole, "name", RoleName.DOCTOR);
  }

  @Test
  @DisplayName("loadUserByUsername: Ném UsernameNotFoundException khi không tìm thấy user theo email")
  void testLoadUserByUsernameThrowsWhenNotFound() {
    String notFoundEmail = "nonexistent.user@aura.hospital";
    when(userRepository.findByEmailIgnoreCase(notFoundEmail)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> userDetailsService.loadUserByUsername(notFoundEmail))
        .isInstanceOf(UsernameNotFoundException.class)
        .hasMessage("Invalid credentials");
  }

  @Test
  @DisplayName("loadById: Ném UsernameNotFoundException khi không tìm thấy user theo UUID")
  void testLoadByIdThrowsWhenNotFound() {
    UUID notFoundId = UUID.randomUUID();
    when(userRepository.findById(notFoundId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> userDetailsService.loadById(notFoundId))
        .isInstanceOf(UsernameNotFoundException.class)
        .hasMessage("Invalid token");
  }

  @Test
  @DisplayName("loadUserByUsername: Tải thành công user với nhiều vai trò (ADMIN + DOCTOR)")
  void testLoadUserByUsernameWithMultipleRoles() {
    when(userRepository.findByEmailIgnoreCase("doctor.opt@aura.hospital")).thenReturn(Optional.of(user));
    when(userRoleRepository.findAllByUserId(userId))
        .thenReturn(List.of(new UserRole(user, adminRole), new UserRole(user, doctorRole)));

    UserDetails userDetails = userDetailsService.loadUserByUsername("doctor.opt@aura.hospital");

    assertThat(userDetails).isNotNull();
    assertThat(userDetails.getUsername()).isEqualTo("doctor.opt@aura.hospital");
    assertThat(userDetails.getPassword()).isEqualTo("hash_secret");
    assertThat(userDetails.isEnabled()).isTrue();
    assertThat(userDetails.getAuthorities())
        .extracting("authority")
        .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_DOCTOR");
  }

  @Test
  @DisplayName("loadById: Tải AuraUserPrincipal thành công khi user bị vô hiệu hóa (active = false)")
  void testLoadByIdInactiveUser() {
    user.setActive(false);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(userRoleRepository.findAllByUserId(userId)).thenReturn(List.of(new UserRole(user, doctorRole)));

    AuraUserPrincipal principal = userDetailsService.loadById(userId);

    assertThat(principal).isNotNull();
    assertThat(principal.id()).isEqualTo(userId);
    assertThat(principal.email()).isEqualTo("doctor.opt@aura.hospital");
    assertThat(principal.enabled()).isFalse();
    assertThat(principal.roles()).containsExactly("DOCTOR");
  }
}
