# Database

Supabase PostgreSQL is the target database. Spring Boot owns schema evolution
through immutable Flyway migrations in
`backend/src/main/resources/db/migration`.

Phase 2 creates only the identity foundation:

- `roles`
- `users`
- `user_roles`

All primary keys are UUIDs. The default roles are `USER`, `DOCTOR`, and `ADMIN`;
no user or password is seeded. Migration files are immutable after execution;
future schema changes require a new versioned migration.

This directory contains design and operational guidance only. It must not
contain database dumps, patient data, credentials, or ad-hoc final SQL files.

