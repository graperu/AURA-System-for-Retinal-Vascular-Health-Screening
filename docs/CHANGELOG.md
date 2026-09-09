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
- Added comprehensive system audit baseline report (`AUDIT_REPORT.md`) matching 39 FRs and 23 NFRs.
- [P0-1 Fix] Eliminated fake clinical fallback when AI service is offline; introduced `ScreeningStatus.FAILED`, database migration `V011`, and automated unit test suite.
- Fixed report and CDS viewer modal closing UX with persistent sticky header and ESC key listener.
- [Handover] Created complete Project Handover Document (`HANDOVER.md`) including Zero-to-One deployment guide, test accounts, database migration matrix, API specifications, and next priority roadmap.
- [Tooling] Added Windows 1-Click launcher script (`start-system.bat`) supporting Docker Compose and local multi-terminal orchestration.

### Removed

- Legacy application source as an intentional rebuild decision.

