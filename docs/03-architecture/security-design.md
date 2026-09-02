# Security design

## Trust boundaries

- The browser is untrusted and receives only public configuration.
- Spring Boot is the authorization and data-access boundary.
- Supabase Storage uses a private bucket and short-lived signed URLs.
- The AI service is internal and accepts only minimal analysis identifiers and
  short-lived image access.

## Secret handling

Secrets are supplied by deployment environments and are never stored in source,
documentation, images, logs, tests, Dockerfiles, or Compose values. Frontend
configuration must not include backend or AI secrets.

## Medical data

Object paths use UUIDs rather than patient names or contact information.
Logs exclude images, signed URLs, authorization data, and unnecessary medical
or identifying information.

## Authentication

Access tokens are signed HMAC JWTs with a 15-minute default lifetime and only
subject/role/time claims. Refresh tokens are high-entropy opaque values kept in
HttpOnly, scoped cookies; only their SHA-256 hashes persist. Every refresh
rotates and revokes the previous token. Spring Security is stateless, CORS uses
an explicit environment allow-list, and CSRF is ignored only for the versioned
authentication API whose cookie is SameSite-scoped.

