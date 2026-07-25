package com.aura.backend.auth.security;

import com.aura.backend.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuraUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AuraUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(AuraUserPrincipal::new)
                .orElseThrow(() -> new UsernameNotFoundException("No account for email " + email));
    }
}
