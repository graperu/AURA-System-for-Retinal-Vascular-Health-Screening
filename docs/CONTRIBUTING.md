# Contributing to AURA

## Workflow

1. Create a feature branch; do not work directly on `main`.
2. Keep changes focused on one phase or feature.
3. Review `git status` and `git diff --staged` before every commit.
4. Run the applicable build, lint, test, and secret-scanning checks.
5. Open a pull request and require successful checks before merge.

Do not commit automatically on behalf of a contributor.

## Security

- Never commit `.env` files, credentials, tokens, signed URLs, private keys, or
  patient data.
- Use environment variables for every private configuration value.
- Never expose backend or AI credentials through frontend variables.
- Do not log passwords, tokens, authorization headers, signed URLs, images, or
  unnecessary identifying and medical data.
- Use synthetic data in tests.
- If a secret is exposed, stop using it, rotate or revoke it, and remove it from
  Git history using an approved incident procedure.

## Engineering boundaries

- Controllers validate requests and delegate to services.
- Controllers do not call repositories directly.
- JPA entities are not returned through API contracts.
- Database changes require new Flyway migrations.
- The frontend calls only the Spring Boot backend.
- Medical language must describe screening support, not a diagnosis.

