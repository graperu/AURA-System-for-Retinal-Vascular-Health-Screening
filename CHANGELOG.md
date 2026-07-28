# Changelog

All notable changes to AURA will be documented in this file.

The format follows Keep a Changelog principles. The project does not yet have a
stable release.

## Unreleased

### Added

- Spring Boot 3 / Java 21 backend foundation.
- PostgreSQL and Flyway identity migrations.
- UUID-based User, Role, and UserRole entities and repositories.
- Standard API response and safe global exception handling.
- Versioned backend health endpoint and foundation tests.
- Maven Wrapper.
- Entity UUID and timestamp lifecycle callbacks aligned with the database
  non-null constraints.
- Email/password registration and login, JWT access tokens, rotating hashed
  refresh tokens, logout, current-account API, and stateless RBAC security.
- Strict Origin/Referer checks for refresh-cookie operations, atomic
  single-use refresh rotation, refresh-token reuse response, logout independent
  of access-token validity, and specific safe JWT authentication errors.

### Removed

- Legacy application source as an intentional rebuild decision.

