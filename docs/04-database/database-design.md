# Database design — Phase 2

## Identity foundation

```text
users 1 ───< user_roles >─── 1 roles
```

`user_roles` is a first-class entity rather than a direct many-to-many mapping.
This leaves room for assignment metadata such as `assigned_by`, `is_active`, and
`revoked_at` in a later migration.

Entity lifecycle is aligned with the non-null database columns: Hibernate's
`@UuidGenerator` creates UUIDs for new entities, while `@PrePersist` initializes
creation/assignment timestamps and `@PreUpdate` refreshes `updated_at`. Existing
seeded role UUIDs remain unchanged because generation applies only when an
entity identifier is unset.

## Tables

- `roles`: UUID key, unique role name, description, audit timestamps.
- `users`: UUID key, unique email, password hash, activation and verification
  flags, audit timestamps, optional soft-delete timestamp.
- `user_roles`: UUID key, foreign keys to users and roles, assignment timestamp,
  unique user-role pair, and indexes on both foreign keys.

No patient, image, analysis, storage, or doctor-assignment tables are part of
this phase.
