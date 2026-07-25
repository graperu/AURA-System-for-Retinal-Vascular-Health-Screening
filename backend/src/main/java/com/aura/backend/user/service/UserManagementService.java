package com.aura.backend.user.service;

import com.aura.backend.common.response.PageResponse;
import com.aura.backend.user.dto.UserResponse;
import com.aura.backend.user.entity.Role;
import com.aura.backend.user.entity.User;
import com.aura.backend.user.exception.SelfManagementNotAllowedException;
import com.aura.backend.user.exception.UserNotFoundException;
import com.aura.backend.user.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Backs the Admin-facing user/RBAC endpoints: FR-18 (search/filter), FR-31 (enable/disable), FR-32 (role). */
@Service
public class UserManagementService {

    private final UserRepository userRepository;

    public UserManagementService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PageResponse<UserResponse> search(Role role, String keyword, Pageable pageable) {
        return PageResponse.from(userRepository.search(role, blankToNull(keyword), pageable), UserResponse::from);
    }

    public UserResponse get(Long id) {
        return UserResponse.from(findOrThrow(id));
    }

    @Transactional
    public UserResponse updateRole(Long id, Role role, Long actingAdminId) {
        User user = findOrThrow(id);
        if (user.getId().equals(actingAdminId) && role != Role.ADMIN) {
            // Guardrail: an admin can't accidentally demote themselves and get locked out.
            throw new SelfManagementNotAllowedException("Admins cannot change their own role.");
        }
        user.setRole(role);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateStatus(Long id, boolean enabled, Long actingAdminId) {
        User user = findOrThrow(id);
        if (user.getId().equals(actingAdminId) && !enabled) {
            throw new SelfManagementNotAllowedException("Admins cannot disable their own account.");
        }
        user.setEnabled(enabled);
        return UserResponse.from(userRepository.save(user));
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
