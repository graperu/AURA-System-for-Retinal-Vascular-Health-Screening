package com.aura.auth.security;

import java.util.*;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record AuraUserPrincipal(
    UUID id, String email, String password, boolean enabled, List<String> roles)
    implements UserDetails {
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
  }

  public String getUsername() {
    return email;
  }

  public String getPassword() {
    return password;
  }

  public boolean isEnabled() {
    return enabled;
  }
}
