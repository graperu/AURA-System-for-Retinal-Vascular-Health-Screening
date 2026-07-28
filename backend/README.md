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

Uploads, Supabase Storage, AI calls, and doctor workflows remain out of scope.

## Authentication APIs

Phase 3 adds email/password register and login, short-lived JWT access tokens,
rotating refresh tokens in HttpOnly cookies, logout, `/auth/me`, and role-based
authorities for `USER`, `DOCTOR`, and `ADMIN`. Configure every `aura.auth` and
CORS variable shown in `.env.example`; no signing-secret fallback exists.

`refresh` and `logout` are cookie-authenticated operations. They require an
exact allow-listed `Origin` header (or an allow-listed origin parsed from
`Referer`) in addition to the refresh cookie. Production must use HTTPS with a
`Secure`, `HttpOnly` cookie. CORS is configured separately and is not treated as
CSRF protection. Refresh rotation is transactional and locks the stored token;
reuse revokes every active refresh token belonging to that account.
The secure defaults are `Secure=true` and `SameSite=Strict`; local HTTP-only
development must explicitly override `REFRESH_COOKIE_SECURE=false`.

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

