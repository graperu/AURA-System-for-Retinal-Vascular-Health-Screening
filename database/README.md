# Database

Supabase PostgreSQL is the target database. Spring Boot owns schema evolution
through immutable Flyway migrations in `backend/src/main/resources/db/migration`.

This directory contains database design and operational guidance only. It must
not contain database dumps, patient data, credentials, or ad-hoc final SQL files.

