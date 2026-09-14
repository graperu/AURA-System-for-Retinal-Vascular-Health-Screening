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
@DisplayName("CustomUserDetailsService - UserDetails & Principal Loading Tests")
class CustomUserDetailsServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private UserRoleRepository userRoleRepository;

  private CustomUserDetailsService userDetailsService;
  private UUID userId;
  private User testUser;
  private Role doctorRole;

  @BeforeEach
  void setUp() {
    userDetailsService = new CustomUserDetailsService(userRepository, userRoleRepository);
    userId = UUID.randomUUID();
    testUser = new User("dr.test@aura.hospital", "hashed_pwd", "Dr. Test User");
    ReflectionTestUtils.setField(testUser, "id", userId);
    testUser.setActive(true);

    doctorRole = new Role();
    ReflectionTestUtils.setField(doctorRole, "name", RoleName.DOCTOR);
  }

  @Test
  @DisplayName("loadUserByUsername: Tải UserDetails thành công kèm danh sách quyền khi email tồn tại")
  void testLoadUserByUsernameSuccess() {
    when(userRepository.findByEmailIgnoreCase("dr.test@aura.hospital")).thenReturn(Optional.of(testUser));
    when(userRoleRepository.findAllByUserId(userId)).thenReturn(List.of(new UserRole(testUser, doctorRole)));

    UserDetails userDetails = userDetailsService.loadUserByUsername("dr.test@aura.hospital");

    assertThat(userDetails).isNotNull();
    assertThat(userDetails.getUsername()).isEqualTo("dr.test@aura.hospital");
    assertThat(userDetails.getPassword()).isEqualTo("hashed_pwd");
    assertThat(userDetails.isEnabled()).isTrue();
    assertThat(userDetails.getAuthorities())
        .extracting("authority")
        .containsExactly("ROLE_DOCTOR");
  }

  @Test
  @DisplayName("loadUserByUsername: Ném UsernameNotFoundException(\"Invalid credentials\") khi không tìm thấy email")
  void testLoadUserByUsernameNotFoundThrows() {
    when(userRepository.findByEmailIgnoreCase("unknown@aura.hospital")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> userDetailsService.loadUserByUsername("unknown@aura.hospital"))
        .isInstanceOf(UsernameNotFoundException.class)
        .hasMessage("Invalid credentials");
  }

  @Test
  @DisplayName("loadById: Tải AuraUserPrincipal thành công khi UUID tồn tại")
  void testLoadByIdSuccess() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
    when(userRoleRepository.findAllByUserId(userId)).thenReturn(List.of(new UserRole(testUser, doctorRole)));

    AuraUserPrincipal principal = userDetailsService.loadById(userId);

    assertThat(principal).isNotNull();
    assertThat(principal.id()).isEqualTo(userId);
    assertThat(principal.email()).isEqualTo("dr.test@aura.hospital");
    assertThat(principal.roles()).containsExactly("DOCTOR");
  }

  @Test
  @DisplayName("loadById: Ném UsernameNotFoundException(\"Invalid token\") khi không tìm thấy UUID")
  void testLoadByIdNotFoundThrows() {
    UUID unknownId = UUID.randomUUID();
    when(userRepository.findById(unknownId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> userDetailsService.loadById(unknownId))
        .isInstanceOf(UsernameNotFoundException.class)
        .hasMessage("Invalid token");
  }
}
