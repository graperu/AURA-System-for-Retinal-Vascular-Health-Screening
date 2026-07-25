# Test plan — Phase 2

## Automated coverage

- Application class loadability without an external database.
- Health endpoint contract through MockMvc.
- Resource-not-found error mapping.
- Success response JSON serialization.
- Repository slice against PostgreSQL Testcontainers when Docker is available.

Tests use synthetic values only. No Supabase credentials or production database
is used.

## Environment limitation

If Docker is unavailable, the Testcontainers repository test is skipped by the
JUnit extension. It must not be reported as passed; rerun it on a host with
Docker for migration/database validation.
