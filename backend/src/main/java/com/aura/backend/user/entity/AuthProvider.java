package com.aura.backend.user.entity;

/** How the account authenticates. LOCAL = email/password, others = social login (FR-1). */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}
