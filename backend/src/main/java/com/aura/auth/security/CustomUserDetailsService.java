package com.aura.auth.security;

import com.aura.user.repository.*;
import java.util.UUID;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {
  private final UserRepository users;
  private final UserRoleRepository roles;

  public CustomUserDetailsService(UserRepository u, UserRoleRepository r) {
    users = u;
    roles = r;
  }

  public UserDetails loadUserByUsername(String email) {
    var u =
        users
            .findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    return principal(u);
  }

  public AuraUserPrincipal loadById(UUID id) {
    return principal(
        users.findById(id).orElseThrow(() -> new UsernameNotFoundException("Invalid token")));
  }

  private AuraUserPrincipal principal(com.aura.user.entity.User u) {
    var names =
        roles.findAllByUserId(u.getId()).stream().map(x -> x.getRole().getName().name()).toList();
    return new AuraUserPrincipal(u.getId(), u.getEmail(), u.getPasswordHash(), u.isActive(), names);
  }
}
