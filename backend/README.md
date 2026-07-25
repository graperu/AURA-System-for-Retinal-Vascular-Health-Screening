# AURA Backend

Java 21 and Spring Boot 3 modular-monolith foundation.

## Phase 2 scope

Implemented in this phase:

- PostgreSQL datasource configuration from environment variables
- Flyway migrations for `roles`, `users`, and `user_roles`
- UUID-based JPA entities and repositories
- Standard success/error response envelopes
- Global safe exception handling
- `GET /api/v1/system/health`

Authentication, JWT, runtime RBAC, uploads, Supabase Storage, AI calls, and
doctor workflows are intentionally out of scope.

## Run

Set the variables from `.env.example` in the process environment, then run:

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean verify
```

The application requires a PostgreSQL-compatible database for normal runtime.
Schema changes are managed only by Flyway; Hibernate is configured with
`ddl-auto: validate`.

Entities use Hibernate UUID generation for new records and lifecycle callbacks
for non-null audit timestamps. Existing seeded role UUIDs are read unchanged.

