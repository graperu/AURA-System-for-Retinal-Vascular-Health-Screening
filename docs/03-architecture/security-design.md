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

