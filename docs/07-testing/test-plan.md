# Test plan — Phase 2

## Automated coverage

- Application class loadability without an external database.
- Health endpoint contract through MockMvc.
- Resource-not-found error mapping.
- Success response JSON serialization.
- Repository slice against PostgreSQL Testcontainers when Docker is available.
- Register validation, normalization, duplicate-email and fixed-role behavior.
- JWT claims, expiry, invalid signature, and signing-secret validation.
- PostgreSQL integration coverage verifies V005, registration and the `USER`
  role, password hashing, duplicate email, hashed refresh-token storage,
  rotation, concurrent single-use, reuse detection, logout/cookie attributes,
  401/403 behavior, and untrusted-origin rejection.
- Origin/Referer enforcement and JWT error mapping also have Docker-independent
  unit coverage.

Tests use synthetic values only. No Supabase credentials or production database
is used.

## Environment limitation

If Docker is unavailable, all PostgreSQL Testcontainers tests are skipped by
the JUnit extension. They must not be reported as passed; rerun them on a host
with a running Docker daemon for migration, persistence, and concurrency
validation.
