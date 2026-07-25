package com.aura.backend.auth.service;

import com.aura.backend.auth.dto.AuthResponse;
import com.aura.backend.auth.dto.LoginRequest;
import com.aura.backend.auth.dto.RefreshRequest;
import com.aura.backend.auth.dto.RegisterRequest;
import com.aura.backend.auth.dto.UserSummary;
import com.aura.backend.auth.exception.AccountDisabledException;
import com.aura.backend.auth.exception.EmailAlreadyExistsException;
import com.aura.backend.auth.exception.InvalidCredentialsException;
import com.aura.backend.auth.security.AuraUserPrincipal;
import com.aura.backend.auth.security.JwtService;
import com.aura.backend.user.entity.AuthProvider;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import com.aura.backend.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        AuthenticationManager authenticationManager,
                        JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /** FR-1: self-registration always creates a plain USER; DOCTOR/CLINIC/ADMIN are granted later via FR-32. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(Role.USER)
                .provider(AuthProvider.LOCAL)
                .enabled(true)
                .build();
        userRepository.save(user);

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (DisabledException e) {
            throw new AccountDisabledException();
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException();
        }

        User user = userRepository.findByEmail(email).orElseThrow(InvalidCredentialsException::new);
        return issueTokens(user);
    }

    /** Exchanges a still-valid refresh token for a fresh access/refresh pair (rotation). */
    public AuthResponse refresh(RefreshRequest request) {
        Claims claims = jwtService.parse(request.refreshToken());
        jwtService.requireType(claims, "refresh");

        User user = userRepository.findByEmail(jwtService.subjectEmail(claims))
                .orElseThrow(() -> new InvalidCredentialsException());
        if (!user.isEnabled()) {
            throw new AccountDisabledException();
        }

        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return AuthResponse.of(accessToken, refreshToken, jwtService.accessTokenTtlSeconds(), UserSummary.from(user));
    }

    public UserSummary currentUser(AuraUserPrincipal principal) {
        return UserSummary.from(principal.getUser());
    }
}
